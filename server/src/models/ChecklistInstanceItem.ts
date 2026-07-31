import { Schema, model } from "mongoose"

// A single completable line item within a ChecklistInstance. Mirrors ChecklistItem's isDone/
// completedAt pre-save pattern, plus completedBy since a checklist instance can have multiple
// assignees and it's worth tracking which of them actually completed each item. Photo fields are
// copied from the parent ChecklistDefinitionItem when the instance is stamped out — see
// jobs/checklistInstanceGenerator.job.ts — and enforced the same way ChecklistItem's are (see
// checklistInstance.service.ts's setItemDone, mirroring checklist.service.ts's completeItem).
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
        instanceId: { type: Schema.Types.ObjectId, ref: "ChecklistInstance", required: true, index: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistInstanceItemSchema.virtual("images", {
    ref: "ChecklistInstanceImage",
    localField: "_id",
    foreignField: "checklistInstanceItemId",
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
