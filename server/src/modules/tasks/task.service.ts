import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskInput, UpdateTaskInput } from "./task.validation.js"
import { Types } from "mongoose"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"

const visiblityFilter = (user: AccessTokenPayload) =>
    user.role === "ADMIN" ? {} : { $or: [{ userId: user.sub }, { assigneeId: user.sub }] }

export const taskService = {
    async list(user: AccessTokenPayload, filterUserId?: string) {
        if (user.role === "ADMIN" && filterUserId) {
            return Task.find({ $or: [{ userId: filterUserId }, { assigneeId: filterUserId }] }).sort({ createdAt: -1 });
        }
        return Task.find(visiblityFilter(user)).sort({ createdAt: -1 });

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

        // Closing out a task means every checklist item is either actually done, or explicitly
        // explained — an item left not-done with no remarks gives no way to tell "forgot about
        // it" from "couldn't finish it, here's why". So this is the one place that's enforced:
        // no remarks required while the item just sits open, but marking the whole task "done"
        // is blocked until every not-done item says why.
        if (input.status === "done") {
            const existing = await Task.findOne({ _id: id, ...visiblityFilter(user) })
                .populate({ path: "checklists", populate: { path: "items" } });
            if (!existing) throw AppError.notFound("Task not found");

            const incomplete = (existing as any).checklists
                .flatMap((cl: any) => cl.items)
                .filter((item: any) => !item.isDone && !item.remarks?.trim());

            if (incomplete.length) {
                throw AppError.badRequest(
                    `Add remarks explaining why these checklist items aren't done before marking this task done: ${incomplete.map((i: any) => i.label).join(", ")}`,
                );
            }
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, ...visiblityFilter(user) },
            input,
            { new: true, runValidators: true },

        );
        if (!task) throw AppError.notFound("Task not found")
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
