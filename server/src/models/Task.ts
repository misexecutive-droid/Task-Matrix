import { Schema, model } from "mongoose"

// Allowed statuses for a Task
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const
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
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        // assigneeId: NEW — optional reference to the User this task has been handed off to.
        // Same idea as Ticket's assigneeId: the task still remembers who originally created it
        // (userId), but it can now also be "given" to someone else to actually do.
        assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },


        // NEW — which department this task belongs to. This is what the daily compliance job
        // (a few files from now) will group by: it needs to answer "for THIS department, across
        // all of its tasks, what's the completion/compliance/quality rate today" — that's only
        // possible if a Task actually records which department it's under.

        departmentId : {type : Schema.Types.ObjectId , ref : "Department", default : null}
    },
    // NEW: added toJSON/toObject virtuals here. Without this, Task documents were missing
    // the `id` field in every API response — only `_id` was present. Your client's Task type
    // (client/src/api/task.ts) has always expected `id: string`, and TaskList.tsx/hook.ts use
    // `task.id` for the update/delete mutation URLs. This is the exact same bug class we found
    // and fixed on User/Department/Store/Category/Ticket/Checklist earlier — a Mongoose document
    // only exposes its auto-generated `id` string in JSON output when this option is set.
    // Practical effect of the bug: clicking a task's status-cycle button or delete button was
    // likely sending requests like `PATCH /tasks/undefined`, which Mongoose can't parse as a
    // valid ObjectId — that throws a CastError, which isn't one of the specific cases your
    // errorHandler.ts checks for, so it would fall through to a generic 500 response.
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

// Virtual field "checklists": not stored on this document directly. When populated, Mongoose
// finds every TaskChecklist whose taskId matches this task's own _id. Same pattern as
// Ticket.ts's "checklists" virtual.

taskSchema.virtual("checklists", {
    ref : "TaskChecklist",
    localField : "_id",
    foreignField : "taskId"
})
// The Mongoose Model used to query/create/update Task documents
export const Task = model("Task", taskSchema)
