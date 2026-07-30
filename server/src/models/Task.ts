import { Schema, model } from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "pending_verification", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const taskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
        dueDate: { type: Date, default: null },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        verifiedAt: { type: Date, default: null },
        verificationNote: { type: String, default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

taskSchema.virtual("checklists", {
    ref: "TaskChecklist",
    localField: "_id",
    foreignField: "taskId",
});

taskSchema.virtual("verifier", {
    ref: "User",
    localField: "verifiedBy",
    foreignField: "_id",
    justOne: true,
});

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ assigneeId: 1, createdAt: -1 }); 
taskSchema.index({ departmentId: 1, createdAt: -1 }); 
taskSchema.index({ status: 1, createdAt: -1 });

export const Task = model("Task", taskSchema);