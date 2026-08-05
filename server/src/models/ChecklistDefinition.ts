import { Schema, model } from "mongoose"

T_RECURRENCES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const
export type ChecklistRecurrence = (typeof CHECKLIST_RECURRENCES)[number]

const checklistDefinitionSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
        recurrence: { type: String, enum: CHECKLIST_RECURRENCES, required: true },
        startDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
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
