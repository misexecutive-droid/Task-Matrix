import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import { assertChecklistsResolved } from "../../utils/checklistGate.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { ConfirmSmartTaskInput, CreateTaskInput, UpdateTaskInput, VerifyTaskInput , confirmSmartTaskSchema } from "./task.validation.js"
import { Types } from "mongoose"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { notificationService } from "../notifications/notification.service.js"
import { emitTaskEvent } from "../../sockets/taskEvent.js"

const visiblityFilter = (user: AccessTokenPayload) => {
    if (user.role === "ADMIN") return {};

    const or: Record<string, unknown>[] = [{ userId: user.sub }, { assigneeId: user.sub }];
    if (user.role === "PC" && user.departmentId) or.push({ departmentId: user.departmentId });
    return { $or: or };
}

export const taskService = {
    async list(user: AccessTokenPayload, filterUserId?: string, status?: string) {
        const ATTACHMENT_THUMBNAIL_SELECT = "url mimeType";

        if (user.role === "ADMIN" && filterUserId) {
            const filter: Record<string, unknown> = { $or: [{ userId: filterUserId }, { assigneeId: filterUserId }] };
            if (status) filter.status = status;
            return Task.find(filter)
                .sort({ createdAt: -1 })
                .populate({ path: "attachments", select: ATTACHMENT_THUMBNAIL_SELECT });
        }
        const filter: Record<string, unknown> = visiblityFilter(user);
        if (status) filter.status = status;
        return Task.find(filter)
            .sort({ createdAt: -1 })
            .populate({ path: "attachments", select: ATTACHMENT_THUMBNAIL_SELECT });

    },

     async createFromSmartInput(input : ConfirmSmartTaskInput, user : AccessTokenPayload) {
        const task = await Task.create({
            title : input.title,
            description : input.context || null,
            category : input.category === "delegated_task" ? "delegation" : "issue",
            priority : input.priority,
            dueDate : input.dueDate,
            userId : user.sub,
            assigneeId : input.assigneeId ?? null,
            departmentId : input.departmentId ?? null,
            aiMeta : {
                rawInput : input.rawInput,
                inputMode : input.inputMode,
                channel : input.channel,
                extractedAssigneeName : input.assigneeRaw || null,
                extractedDepartment : input.departmentRaw || null,
                confidence : input.confidence ?? null,
                model : input.wonBy ?? null,
            }
        })

        emitTaskEvent('task:created', {
            userId: task.userId?.toString(),
            assigneeId: task.assigneeId?.toString() ?? null,
            departmentId: task.departmentId?.toString() ?? null,
        }, task);

        return task;
    },

    async getById(id: string, user: AccessTokenPayload) {
        const task = await Task.findOne({ _id: id, ...visiblityFilter(user) })
            .populate({ path: "checklists", populate: { path: "items", populate: { path: "images" } } })
            .populate({ path: "attachments", populate: { path: "uploadedBy", select: "email firstName role" } });
        if (!task) throw AppError.notFound("Task not found")
        return task;
    },

    async create(input: CreateTaskInput, user: AccessTokenPayload) {
        return Task.create({ ...input, userId: user.sub })
    },

    async update(id: string, input: UpdateTaskInput, user: AccessTokenPayload) {
        if (user.role === "PC") {
            throw AppError.forbidden("PC can only act on a task through the verification queue.")
        }

        const existing = await Task.findOne({ _id: id, ...visiblityFilter(user) })
            .populate({ path: "checklists", populate: { path: "items" } });
        if (!existing) throw AppError.notFound("Task not found");

        const beforeStatus = existing.status;

        if (input.status === "done" && beforeStatus !== "done") {
            if (user.role !== "ADMIN") {
                throw AppError.forbidden("Only a verifier can mark a task done — send it for review instead.")
            }
        } else if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            assertChecklistsResolved((existing as any).checklists, "sending this task for review")
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, ...visiblityFilter(user) },
            input,
            { new: true, runValidators: true },

        );
        if (!task) throw AppError.notFound("Task not found")

        if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            await notificationService.notifyPendingVerification(task as any, 'TASK');
        }

        return task;
    },


    async verify(id: string, input: VerifyTaskInput, user: AccessTokenPayload) {
        const task = await Task.findById(id);
        if (!task) throw AppError.notFound("Task not found")

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

    async complianceReport(groupBy: "hour" | "day" | "week" | "month" | "year", departmentId?: string, from?: string, to?: string, userId?: string) {
        const DATE_FORMATS: Record<"hour" | "day" | "week" | "month" | "year", string> = {
            hour: '%Y-%m-%dT%H:00',
            day: '%Y-%m-%d',
            week: '%G-W%V',
            month: '%Y-%m',
            year: '%Y',
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
            ...(userId ? [{
                $match: {
                    $or: [
                        { "task.userId": new Types.ObjectId(userId) },
                        { "task.assigneeId": new Types.ObjectId(userId) },
                    ],
                },
            }] : []),
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
