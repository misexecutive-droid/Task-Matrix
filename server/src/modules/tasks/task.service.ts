import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import { assertChecklistsResolved } from "../../utils/checklistGate.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskInput, UpdateTaskInput, VerifyTaskInput } from "./task.validation.js"
import { Types } from "mongoose"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { notificationService } from "../notifications/notification.service.js"

const visiblityFilter = (user: AccessTokenPayload) => {
    if (user.role === "ADMIN") return {};

    const or: Record<string, unknown>[] = [{ userId: user.sub }, { assigneeId: user.sub }];
    // PC additionally sees every task in their own department (read-only — see the forbidden
    // check at the top of update() below, they can only act on a task through verify()).
    if (user.role === "PC" && user.departmentId) or.push({ departmentId: user.departmentId });
    return { $or: or };
}

// Is this task inside the PC's own department? (Task has no storeId field, unlike Ticket.)
const isSameDept = (user: AccessTokenPayload, task: any) =>
    Boolean(user.departmentId && String(task.departmentId) === user.departmentId)

export const taskService = {
    async list(user: AccessTokenPayload, filterUserId?: string, status?: string) {
        if (user.role === "ADMIN" && filterUserId) {
            const filter: Record<string, unknown> = { $or: [{ userId: filterUserId }, { assigneeId: filterUserId }] };
            if (status) filter.status = status;
            return Task.find(filter).sort({ createdAt: -1 });
        }
        const filter: Record<string, unknown> = visiblityFilter(user);
        if (status) filter.status = status;
        return Task.find(filter).sort({ createdAt: -1 });

    },


    async getById(id: string, user: AccessTokenPayload) {
        const task = await Task.findOne({ _id: id, ...visiblityFilter(user) })
            .populate({ path: "checklists", populate: { path: "items", populate: { path: "images" } } });
        if (!task) throw AppError.notFound("Task not found") 
        return task;
    },


    async create(input: CreateTaskInput, user: AccessTokenPayload) {
        return Task.create({ ...input, userId: user.sub })
    },

    async update(id: string, input: UpdateTaskInput, user: AccessTokenPayload) {
        // PC only ever acts through taskService.verify() — never the generic update path.
        if (user.role === "PC") {
            throw AppError.forbidden("PC can only act on a task through the verification queue.")
        }

        const existing = await Task.findOne({ _id: id, ...visiblityFilter(user) })
            .populate({ path: "checklists", populate: { path: "items" } });
        if (!existing) throw AppError.notFound("Task not found");

        const beforeStatus = existing.status;

        if (input.status === "done" && beforeStatus !== "done") {
            // Marking a task truly done is now a PC/Admin-only action, done through
            // taskService.verify() — everyone else (PC is already blocked above) can only
            // hand it off to pending_verification (see the gate right below) and wait for
            // that step.
            if (user.role !== "ADMIN") {
                throw AppError.forbidden("Only a verifier can mark a task done — send it for review instead.")
            }
        } else if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            // Sending a task for review is blocked until every not-done checklist item has
            // remarks explaining why — same rule as before, just retargeted from "done" to
            // this hand-off point.
            assertChecklistsResolved((existing as any).checklists, "sending this task for review")
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, ...visiblityFilter(user) },
            input,
            { new: true, runValidators: true },

        );
        if (!task) throw AppError.notFound("Task not found")

        // Just handed off to review — let the department's PCs know there's something to check.
        if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            await notificationService.notifyPendingVerification(task as any, 'TASK');
        }

        return task;
    },

    // PC/Admin-only: approve (truly mark done) or reject (bounce back to in_progress) a task
    // that's currently pending_verification.
    async verify(id: string, input: VerifyTaskInput, user: AccessTokenPayload) {
        const task = await Task.findById(id);
        if (!task) throw AppError.notFound("Task not found")

        // PC is scoped to their own department, same idea as the ticket-side check; ADMIN can
        // verify anything regardless of scope.
        if (user.role === "PC" && !isSameDept(user, task)) {
            throw AppError.forbidden("Outside your department")
        }

        if (task.status !== "pending_verification") {
            throw AppError.badRequest("This task isn't pending verification.")
        }

        if (input.action === "APPROVE") {
            task.status = "done";
            task.verifiedBy = user.sub as any;
            task.verifiedAt = new Date();
            task.verificationNote = input.note ?? null;
        } else {
            task.status = "in_progress";
            task.verificationNote = input.note ?? null;
        }
        await task.save()

        await notificationService.notifyVerificationResult(task as any, input.action, input.note, 'TASK')

        return task;
    },

    async remove(id: string, user: AccessTokenPayload) {
        const task = await Task.findOneAndDelete({ _id: id, ...visiblityFilter(user) })

        if (!task) throw AppError.notFound("Task not found");
        return task;
    },

    async complianceReport(groupBy: "hour" | "day" | "week" | "month", departmentId?: string, from?: string, to?: string) {
        const DATE_FORMATS: Record<"hour" | "day" | "week" | "month", string> = {
            hour: '%Y-%m-%dT%H:00',
            day: '%Y-%m-%d',
            week: '%G-W%V',
            month: '%Y-%m',
        };

        const match: Record<string, any> = {};
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = new Date(from);
            if (to) match.createdAt.$lte = new Date(to);
        }

        const rows = await TaskChecklistItem.aggregate([
            { $match: match },
            { $lookup: { from: "taskchecklists", localField: "taskChecklistId", foreignField: "_id", as: "checklist" } },
            { $unwind: "$checklist" },
            { $lookup: { from: "tasks", localField: "checklist.taskId", foreignField: "_id", as: "task" } },
            { $unwind: "$task" },
            ...(departmentId ? [{ $match: { "task.departmentId": new Types.ObjectId(departmentId) } }] : []),
            { $lookup: { from: "taskimages", localField: "_id", foreignField: "taskChecklistItemId", as: "images" } },
            {
                $addFields: {
                    bucket: { $dateToString: { format: DATE_FORMATS[groupBy], date: "$createdAt" } },
                    qualifyingImageCount: {
                        $cond: [
                            '$requiresLivePhoto',
                            { $size: { $filter: { input: '$images', cond: { $eq: ['$$this.captureMethod', 'LIVE'] } } } },
                            { $size: '$images' },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$bucket",
                    totalItems: { $sum: 1 },
                    doneItems: { $sum: { $cond: ["$isDone", 1, 0] } },
                    itemsRequiringPhotos: { $sum: { $cond: [{ $gt: ["$requiredImageCount", 0] }, 1, 0] } },
                    photoCompliantItems: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gt: ['$requiredImageCount', 0] }, { $gte: ["$qualifyingImageCount", "$requiredImageCount"] }] },
                                1, 0,
                            ],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return rows.map(r => ({
            bucket: r._id as string,
            totalItems: r.totalItems as number,
            doneItems: r.doneItems as number,
            completionRate: r.totalItems ? Math.round((r.doneItems / r.totalItems) * 1000) / 10 : null,
            itemsRequiringPhotos: r.itemsRequiringPhotos as number,
            qualityRate: r.itemsRequiringPhotos ? Math.round((r.photoCompliantItems / r.itemsRequiringPhotos) * 1000) / 10 : null,
        }));
    },

};
