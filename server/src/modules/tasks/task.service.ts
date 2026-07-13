import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskInput, UpdateTaskInput } from "./task.validation.js"
import { Types } from "mongoose"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { departmentRouter } from "../departments/department.routes.js"

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

    async complianceReport(groupBy: "hour" | "day" | "week" | "month", deparmentId?: string, to?: string) {
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
        };

        const rows = await updateTaskChecklistItem.aggregate([
            { $match: match },
            { $lookup: { from: "taskchecklists", localField: "checklist.taskId", foreignField: "id", as: "task" } },
            { $unwind: "$checklist" },
            { $lookup: { from: "tasks", localField: "checklist.taskId", foreignField: "_id", as: "task" } },
            { $unwind: "$task" },
            ...(deparmentId ? [{ $match: { "task.departmentId": new Types.ObjectId(deparmentId) } }] : []),
            { $lookup: { from: "taskImages", localField: "_id", foreignField: "taskChecklistItemId", as: "images" } },
            {
                $addFields: {
                    bucket: { $dateToString: { format: DATE_FORMATS[groupBy], date: "$createAt" } },
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
                $group : {
                    _id : "$bucket",
                    totalItem : { $sum : 1},
                    doneItems : { $sum : { $cond : ["$isDone", 1,0]},
                    itemsRequiringPhotos : { $sum : [{ $gt : ["$requiredImageCount", 0]}, 1, 0]}},
                    photoCompliantItems : {
                        $sum : {
                            $cond : [
                                { $and : [{ $gt : ['$requiredImageCount', 0]}, { $gte : ["$qualifyingImageCount", "$requiredImageCount"]}]},
                                1,0

                            ]
                        }
                    }

                }
            },

            { $sort : {_id : 1}},
        ]);

        return rows.map(r => ({
            bucket : r._id as string,
            totalItems : r.totalItems as number,
            doneItems : r.doneItems as number,
            completionRate : r.totalItems ? Math.round((r.doneItems/r.totalItems)* 1000) / 10 : null,
            itemsRequiringPhotos : r.itemsRequiringPhotos as number,
            qualityRate : r.itemsRequiringPhots ? Math.round((r.photoCompliantItems / r.itemsRequiringPhots) * 1000) / 10 : null,

        }));

    },

};
