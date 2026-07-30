import { Schema, model } from "mongoose"
import { CHECKLIST_RECURRENCES } from "./ChecklistDefinition.js"

const checklistInstanceSchema = new Schema(
    {
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
        title: { type: String, required: true },
        recurrence: { type: String, enum: CHECKLIST_RECURRENCES, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
        assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        periodKey: { type: String, required: true, index: true },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        generatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistInstanceSchema.index({ definitionId: 1, periodKey: 1 }, { unique: true })
checklistInstanceSchema.index({ assigneeIds : 1, periodStart : -1})
checklistInstanceSchema.index({ periodStart : -1})

checklistInstanceSchema.virtual("items", {
    ref: "ChecklistInstanceItem",
    localField: "_id",
    foreignField: "instanceId",
})

export const ChecklistInstance = model("ChecklistInstance", checklistInstanceSchema)
