import { Schema, model } from "mongoose"

export const CHECKLIST_ITEM_TYPES = ["STANDARD", "AUDIT"] as const
export type ChecklistItemType = (typeof CHECKLIST_ITEM_TYPES)[number]

// A single line item within a ChecklistDefinition. No per-item assignee/dueAt — assignment
// lives at the checklist level via ChecklistDefinition.assigneeIds (see that model for why).
// Photo requirements DO live here (mirroring ChecklistTemplateItem/ChecklistItem) since they're
// evidence rules for the step itself, not an assignment concept — copied onto each generated
// ChecklistInstanceItem at stamp-out time (see jobs/checklistInstanceGenerator.job.ts).
//
// itemType "AUDIT" is the one exception to "no per-item assignee": it names specific users
// (auditUserIds) who must each independently submit their own evidence against this one step —
// see ChecklistInstanceItemSubmission.ts, one row per required user, stamped out alongside the
// ChecklistInstanceItem itself. accessories is an admin-defined checklist (e.g. "Shoes", "Belt")
// each auditor checks off on their own submission; requiredImageCount/requiresLivePhoto above
// describe the photo requirement each auditor must individually satisfy, not a shared pool.
const checklistDefinitionItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        requiredImageCount: { type: Number, default: 0, min: 0 },
        maxImageCount: { type: Number, default: null, min: 0 },
        requiresLivePhoto: { type: Boolean, default: false },
        itemType: { type: String, enum: CHECKLIST_ITEM_TYPES, default: "STANDARD" },
        auditUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        accessories: [{ type: String, trim: true }],
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistDefinitionItem = model("ChecklistDefinitionItem", checklistDefinitionItemSchema)
