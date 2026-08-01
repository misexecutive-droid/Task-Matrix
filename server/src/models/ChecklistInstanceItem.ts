import { Schema, model } from "mongoose"
import { CHECKLIST_ITEM_TYPES } from "./ChecklistDefinitionItem.js"

// A single completable line item within a ChecklistInstance. Mirrors ChecklistItem's isDone/
// completedAt pre-save pattern, plus completedBy since a checklist instance can have multiple
// assignees and it's worth tracking which of them actually completed each item. Photo fields are
// copied from the parent ChecklistDefinitionItem when the instance is stamped out — see
// jobs/checklistInstanceGenerator.job.ts — and enforced the same way ChecklistItem's are (see
// checklistInstance.service.ts's setItemDone, mirroring checklist.service.ts's completeItem).
//
// For itemType "AUDIT", isDone/completedBy above are NOT driven by setItemDone at all — they're
// server-derived by checklistInstanceItemSubmission.service.ts's markDone, which sets isDone=true
// only once every sibling ChecklistInstanceItemSubmission (see that model, one per required
// auditor) is itself done. Keeping isDone accurate here is what lets syncVerificationStatus and
// every other item.isDone consumer keep working unmodified for audit items too.
const checklistInstanceItemSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        isDone: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        requiredImageCount: { type: Number, default: 0, min: 0 },
        maxImageCount: { type: Number, default: null, min: 0 },
        requiresLivePhoto: { type: Boolean, default: false },
        itemType: { type: String, enum: CHECKLIST_ITEM_TYPES, default: "STANDARD" },
        accessories: [{ type: String, trim: true }],
        instanceId: { type: Schema.Types.ObjectId, ref: "ChecklistInstance", required: true, index: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistInstanceItemSchema.virtual("images", {
    ref: "ChecklistInstanceImage",
    localField: "_id",
    foreignField: "checklistInstanceItemId",
})

checklistInstanceItemSchema.virtual("submissions", {
    ref: "ChecklistInstanceItemSubmission",
    localField: "_id",
    foreignField: "itemId",
})

// Keep completedAt in sync with isDone automatically, same convention as ChecklistItemSchema.
// completedBy is set explicitly by the service (before save) when marking an item done, since
// this hook has no access to the requesting user — it only clears completedBy on un-marking.
checklistInstanceItemSchema.pre("save", function (next) {
    if (this.isModified("isDone")) {
        this.completedAt = this.isDone ? new Date() : null
        if (!this.isDone) this.completedBy = null
    }
    next()
})

export const ChecklistInstanceItem = model("ChecklistInstanceItem", checklistInstanceItemSchema)
