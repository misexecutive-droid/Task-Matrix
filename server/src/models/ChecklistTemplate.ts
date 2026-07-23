import { Schema, model } from "mongoose"

// A reusable, admin-authored checklist definition — created once under the Admin section, then
// applied ("stamped out") onto individual Tasks or Tickets as a real TaskChecklist/Checklist
// instead of an admin re-typing the same items by hand every time.

export const CHECKLIST_TEMPLATE_TARGETS = ["TASK", "TICKET"] as const
export type ChecklistTemplateTarget = (typeof CHECKLIST_TEMPLATE_TARGETS)[number]

const checklistTemplateSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        // appliesTo: which checklist system this template can be applied to — Tasks and Tickets
        // are separate models (TaskChecklist vs Checklist), so a template has to declare which
        // one its items are meant for.
        appliesTo: { type: String, enum: CHECKLIST_TEMPLATE_TARGETS, required: true },
        // Optional — scopes which users can be picked as an item's defaultAssigneeId (see
        // ChecklistTemplateItem). Not required: a template can stay department-agnostic.
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistTemplateSchema.virtual("items", {
    ref: "ChecklistTemplateItem",
    localField: "_id",
    foreignField: "templateId",
})

export const ChecklistTemplate = model("ChecklistTemplate", checklistTemplateSchema)