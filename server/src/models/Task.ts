import { Schema, model } from "mongoose"

// Allowed statuses for a Task (note: casing is inconsistent with other files' enums - left as-is)
export const TASK_STATUSES = ["todo", "in_Progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Allowed priority levels for a Task
export const TASK_PRIORITIES = ["low", "medium", "high"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

// Schema (shape) for a Task document
const taskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        // status/priority: restricted to the enum lists above, with sensible defaults
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
        dueDate: { type: Date, default: null },
        // projectId: optional reference linking this task to a Project document
        projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
        // userId: reference to the User who owns/created this task (required)
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }, // adds createdAt/updatedAt automatically (no toJSON/toObject virtuals set here)
)

// The Mongoose Model used to query/create/update Task documents
export const Task = model("Task", taskSchema)