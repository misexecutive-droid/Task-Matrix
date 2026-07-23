import { Schema, model } from "mongoose"

// An admin-authored recurring checklist rule, scoped to a department and a specific set of
// assigned users. A background job (see jobs/checklistInstanceGenerator.job.ts) reads active
// definitions and stamps out a completable ChecklistInstance whenever the recurrence period
// elapses. This is deliberately separate from ChecklistTemplate (which seeds a one-off Task/
// Ticket checklist on demand, with no department/recurrence/assignee concept of its own).

export const CHECKLIST_RECURRENCES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const
export type ChecklistRecurrence = (typeof CHECKLIST_RECURRENCES)[number]

const checklistDefinitionSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
        recurrence: { type: String, enum: CHECKLIST_RECURRENCES, required: true },
        // Anchor date the recurrence is computed from. For ONE_TIME this IS the single due day.
        startDate: { type: Date, required: true },
        // Pause/resume switch — the generator job skips definitions where this is false.
        isActive: { type: Boolean, default: true },
        // Specific users within departmentId picked by the admin, not the whole department.
        assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistDefinitionSchema.virtual("items", {
    ref: "ChecklistDefinitionItem",
    localField: "_id",
    foreignField: "definitionId",
})

export const ChecklistDefinition = model("ChecklistDefinition", checklistDefinitionSchema)
