import { Schema, model } from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "pending_verification", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_CATEGORIES = ["issue", "delegation"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_REMINDER_CHANNELS = ["notification", "alarm", "email", "sms"] as const;
export type TaskReminderChannel = (typeof TASK_REMINDER_CHANNELS)[number];


const taskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        category : {type : String, enum: TASK_CATEGORIES, default : "delegation" },
        priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
        startDate: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        // How long before dueDate to send a reminder notification (null = no reminder wanted).
        reminderMinutesBefore: { type: Number, default: null },
        // Which channel taskDeadlineReminder.job.ts should use when the reminder fires.
        reminderChannel: { type: String, enum: TASK_REMINDER_CHANNELS, default: "notification" },
        // Set once taskDeadlineReminder.job.ts actually fires the reminder, so the sweep never
        // sends it twice — reset to null whenever dueDate or reminderMinutesBefore changes.
        reminderSentAt: { type: Date, default: null },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        // Extra people assigned alongside assigneeId (the primary) — kept separate rather than
        // folding assigneeId into this array so the AI/WhatsApp parsing pipeline, socket room
        // fanout, and compliance reports (all single-assignee) don't need to change at all.
        additionalAssigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        verifiedAt: { type: Date, default: null },
        verificationNote: { type: String, default: null },

        submittedAt : { type : Date, default : null},
        submisssionNote : { type : String, default : null},

        // ---new : raw AI Extractioni trace (MONOG's answer to a Postgres JSONB column )

        aiMeta : {
            type : new Schema(
                {
                    rawInput : {type : String, default : null},
                    inputMode : { type : String, enum : ["voice", "text"], default : null },
                    channel : { type : String, enum : ["whatsapp", "web"], default : null},
                    extractedAssigneeName : { type : String, default : null},
                    extractedDepartment : { type : String, default : null},
                    confidence : { type : Number, default : null},
                    model : { type : String, default : null},

                },
                {_id : false}
            ),
            default : null,
        },
        
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

taskSchema.virtual("attachments", {
    ref: "TaskAttachment",
    localField: "_id",
    foreignField: "taskId",
});

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ assigneeId: 1, createdAt: -1 });
taskSchema.index({ additionalAssigneeIds: 1, createdAt: -1 });
taskSchema.index({ departmentId: 1, createdAt: -1 }); 
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ category : 1, status : 1, createdAt : -1}) // board queue filtering (Issues vs Deleagated)

export const Task = model("Task", taskSchema);