import { Schema, model } from "mongoose"

// One line item within a ChecklistTemplate. Deliberately no dueAt here — that's a per-instance
// specific that only makes sense once the template has been applied to a real Task or Ticket, not
// something a reusable definition should hard-code.

const checklistTemplateItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        // order: where this item should appear within the template — templates are usually
        // authored as an ordered sequence of steps.
        order: { type: Number, default: 0 },

        requiredImageCount: { type: Number, default: 0, min: 0 },
        maxImageCount: { type: Number, default: null, min: 0 },
        requiresLivePhoto: { type: Boolean, default: false },

        // Optional seed value, scoped to the parent template's departmentId — carried over as the
        // created TaskChecklistItem/ChecklistItem's assigneeId when the template is applied
        // (see task.service.ts / ticket.service.ts's addFromTemplate flows). Admins can still
        // change the assignee afterward on the real checklist item.
        defaultAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },

        templateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistTemplateItem = model("ChecklistTemplateItem", checklistTemplateItemSchema)