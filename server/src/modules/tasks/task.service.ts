import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import { assertChecklistsResolved } from "../../utils/checklistGate.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { ConfirmSmartTaskInput, CreateTaskInput, UpdateTaskInput, VerifyTaskInput , confirmSmartTaskSchema } from "./task.validation.js"
import { Types } from "mongoose"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { notificationService } from "../notifications/notification.service.js"
import { emitTaskEvent } from "../../sockets/taskEvent.js"
import { DATE_FORMATS, type DateBucket } from "../../utils/index.js"

// ADMIN and PC both get full org-wide visibility — PC's whole job is verification, so capping
// them to their own department made most of the org invisible to them and left the "filter by
// department/person" view (AdminTaskList) unusable for anyone but an admin. Safe to broaden here:
// PC is still blocked from create/delete at the route level (task.routes.ts) and from raw status
// updates in update() below, so this only actually widens list/getById/verify.
// Same-department/creator/assignee visibility everyone below ADMIN/PC gets by default.
const selfAndDepartmentFilter = (user: AccessTokenPayload) =>
    ({ $or: [{ userId: user.sub }, { assigneeId: user.sub }, { additionalAssigneeIds: user.sub }] });

const visiblityFilter = (user: AccessTokenPayload) => {
    if (user.role === "ADMIN" || user.role === "PC") return {};

    // MANAGER is this app's "department head" role — they get everything within their own
    // department (not just tasks they created or were assigned), on top of the same
    // creator/assignee visibility everyone else gets for tasks outside their department. This is
    // read-only reach: update() below deliberately does NOT use this function for that reason —
    // see mutationFilter.
    if (user.role === "MANAGER" && user.departmentId) {
        const base = selfAndDepartmentFilter(user);
        return { $or: [{ departmentId: user.departmentId }, ...base.$or] };
    }

    return selfAndDepartmentFilter(user);
}

// update()'s authorization check — deliberately narrower than visiblityFilter. ADMIN/PC still
// get unrestricted edit rights (PC is separately blocked from calling update() at all, just
// below), but MANAGER's department-wide *visibility* must not silently double as department-wide
// *edit* rights — being able to see a colleague's delegation is not the same as being allowed to
// retitle it, reassign it, or move its due date. Everyone else keeps the same creator/assignee
// scope they always had.
const mutationFilter = (user: AccessTokenPayload) => {
    if (user.role === "ADMIN" || user.role === "PC") return {};
    return selfAndDepartmentFilter(user);
}

export const taskService = {
    async list(user: AccessTokenPayload, filterUserId?: string, status?: string, page = 1, limit = 200) {
        const ATTACHMENT_THUMBNAIL_SELECT = "url mimeType";

        const filter: Record<string, unknown> = (user.role === "ADMIN" || user.role === "PC") && filterUserId
            ? { $or: [{ userId: filterUserId }, { assigneeId: filterUserId }, { additionalAssigneeIds: filterUserId }] }
            : visiblityFilter(user);
        if (status) filter.status = status;

        return Task.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
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
        if (!task) throw AppError.notFound("Delegation not found")
        return task;
    },

    async create(input: CreateTaskInput, user: AccessTokenPayload) {
        return Task.create({ ...input, userId: user.sub })
    },

    async update(id: string, input: UpdateTaskInput, user: AccessTokenPayload) {
        if (user.role === "PC") {
            throw AppError.forbidden("PC can only act on a delegation through the verification queue.")
        }

        const existing = await Task.findOne({ _id: id, ...mutationFilter(user) })
            .populate({ path: "checklists", populate: { path: "items" } });
        if (!existing) throw AppError.notFound("Delegation not found");

        const beforeStatus = existing.status;

        if (input.status === "done" && beforeStatus !== "done") {
            if (user.role !== "ADMIN") {
                throw AppError.forbidden("Only a verifier can mark a delegation done — send it for review instead.")
            }
        } else if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            assertChecklistsResolved((existing as any).checklists, "sending this delegation for review")
        }

        // Moving the deadline (or changing/clearing the reminder lead time) invalidates whatever
        // reminder was already scheduled for the old dueDate — re-arm it so the sweep can send a
        // fresh one instead of treating this task as already handled.
        const update: UpdateTaskInput & { reminderSentAt?: null } = { ...input };
        if ("dueDate" in input || "reminderMinutesBefore" in input) {
            update.reminderSentAt = null;
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, ...mutationFilter(user) },
            update,
            { new: true, runValidators: true },

        );
        if (!task) throw AppError.notFound("Delegation not found")

        if (input.status === "pending_verification" && beforeStatus !== "pending_verification") {
            await notificationService.notifyPendingVerification(task as any, 'TASK');
        }

        return task;
    },


       async verify(id: string, input: VerifyTaskInput, user: AccessTokenPayload) {
        const task = await Task.findOne({ _id: id, ...visiblityFilter(user) });
        if (!task) throw AppError.notFound("Delegation not found")

        if (task.status !== "pending_verification") {
            throw AppError.badRequest("This delegation isn't pending verification.")
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

        if (!task) throw AppError.notFound("Delegation not found");
        return task;
    },

    async complianceReport(groupBy: DateBucket, departmentId?: string, from?: string, to?: string, userId?: string, departmentIds?: string[]) {

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
            // A SENIOR has no department of their own — this matches every department that
            // belongs to their store instead (see reportScope.ts's resolveDepartmentIdsForStore).
            // Checked explicitly against `undefined` so an empty array (a store with zero
            // departments assigned yet) still matches nothing, rather than silently matching
            // everything.
            ...(departmentIds !== undefined
                ? [{ $match: { "task.departmentId": { $in: departmentIds.map((id) => new Types.ObjectId(id)) } } }]
                : []),
            ...(userId ? [{
                $match: {
                    $or: [
                        { "task.userId": new Types.ObjectId(userId) },
                        { "task.assigneeId": new Types.ObjectId(userId) },
                        { "task.additionalAssigneeIds": new Types.ObjectId(userId) },
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
