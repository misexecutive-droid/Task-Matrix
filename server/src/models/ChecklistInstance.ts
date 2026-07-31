import { Schema, model } from "mongoose"
import { CHECKLIST_RECURRENCES } from "./ChecklistDefinition.js"

// Review state a PC/Admin puts an instance through once every item is checked off — same fields
// as Ticket's verifiedBy/verifiedAt/verificationNote, but tracked as an explicit status here
// (rather than folded into a general status enum like Ticket's) since ChecklistInstance has no
// status field of its own otherwise. NOT_SUBMITTED covers both "never touched" and "no longer
// fully done after an item got unchecked"; PENDING means every item is done and it's awaiting
// review; APPROVED/REJECTED are terminal-ish but REJECTED auto-returns to PENDING the moment
// every item is done again (see checklistInstance.service.ts's setItemDone).
export const CHECKLIST_VERIFICATION_STATUSES = ["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"] as const
export type ChecklistVerificationStatus = (typeof CHECKLIST_VERIFICATION_STATUSES)[number]

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
        verificationStatus: { type: String, enum: CHECKLIST_VERIFICATION_STATUSES, default: "NOT_SUBMITTED" },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        verifiedAt: { type: Date, default: null },
        verificationNote: { type: String, default: null },
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

checklistInstanceSchema.virtual("verifier", {
    ref: "User",
    localField: "verifiedBy",
    foreignField: "_id",
    justOne: true,
})

export const ChecklistInstance = model("ChecklistInstance", checklistInstanceSchema)
