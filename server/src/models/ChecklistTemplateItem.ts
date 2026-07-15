import { Schema, model } from "mongoose"

// One line item within a ChecklistTemplate. Deliberately no assigneeId/dueAt here — those are
// per-instance specifics that only make sense once the template has been applied to a real
// Task or Ticket, not something a reusable definition should hard-code.

const checklistTemplateItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        // order: where this item should appear within the template — templates are usually
        // authored as an ordered sequence of steps.
        order: { type: Number, default: 0 },

        requiredImageCount: { type: Number, default: 0, min: 0 },
        maxImageCount: { type: Number, default: null, min: 0 },
        requiresLivePhoto: { type: Boolean, default: false },

        templateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistTemplateItem = model("ChecklistTemplateItem", checklistTemplateItemSchema)