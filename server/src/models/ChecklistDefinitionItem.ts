import { Schema, model } from "mongoose"

// A single line item within a ChecklistDefinition. No per-item assignee/dueAt — assignment
// lives at the checklist level via ChecklistDefinition.assigneeIds (see that model for why).
// Photo requirements DO live here (mirroring ChecklistTemplateItem/ChecklistItem) since they're
// evidence rules for the step itself, not an assignment concept — copied onto each generated
// ChecklistInstanceItem at stamp-out time (see jobs/checklistInstanceGenerator.job.ts).
const checklistDefinitionItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        requiredImageCount: { type: Number, default: 0, min: 0 },
        maxImageCount: { type: Number, default: null, min: 0 },
        requiresLivePhoto: { type: Boolean, default: false },
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistDefinitionItem = model("ChecklistDefinitionItem", checklistDefinitionItemSchema)
