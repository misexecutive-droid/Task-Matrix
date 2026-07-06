import { Schema, model } from "mongoose"

export const TASK_STATUSES = ["todo", "in_Progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

const taskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
        dueDate: { type: Date, default: null },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true },
)

export const Task = model("Task", taskSchema)