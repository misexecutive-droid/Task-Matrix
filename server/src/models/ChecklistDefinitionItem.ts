import { Schema, model } from "mongoose"

// A single line item within a ChecklistDefinition. Deliberately minimal — no per-item
// assignee/dueAt/photo fields, since assignment lives at the checklist level via
// ChecklistDefinition.assigneeIds (see that model for why).
const checklistDefinitionItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistDefinitionItem = model("ChecklistDefinitionItem", checklistDefinitionItemSchema)
