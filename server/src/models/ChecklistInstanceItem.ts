import { Schema, model } from "mongoose"
import { CHECKLIST_ITEM_TYPES, CHECKLIST_CONDITIONAL_ACTIONS } from "./ChecklistDefinitionItem.js"

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
//
// For itemType "NUMBER_ENTRY", numericValue holds the reading entered for this run (checked
// against numberEntryMin/Max — copied from the parent ChecklistDefinitionItem at stamp-out time —
// by checklistInstance.service.ts's setItemDone before isDone is allowed to flip true).
//
// For itemType "RATING", numericValue holds the star rating given (1..ratingScale) — same field,
// same stamp-out copy, checked by a different bound (1..ratingScale instead of min/max).
//
// For itemType "YES_NO"/"PASS_FAIL", booleanAnswer holds the two-way answer. For
// "MULTIPLE_CHOICE"/"DROPDOWN"/"TEXT_BOX", textValue holds the answer (constrained to `options`
// for the first two, free-form for TEXT_BOX). For "DATE_TIME", dateValue holds the answer.
//
// For itemType "GPS", gpsLat/Lng/Accuracy/CapturedAt hold the reading taken from the assignee's
// device — checked against gpsTargetLat/Lng/RadiusMeters (copied from the definition item at
// stamp-out) when those are set. For "QR_SCAN", the scanned code reuses the same textValue slot
// TEXT_BOX uses, checked against qrExpectedValue when set. For "CASH_TALLY", the counted amount
// reuses the same numericValue slot NUMBER_ENTRY/RATING use, alongside cashExpectedAmount (copied
// from the definition item) purely for the UI's expected-vs-counted variance display. For
// "SIGNATURE"/"DUAL_SIGNATURE", signatureValue (and secondSignatureValue for the second signer)
// holds a PNG data URL of the signature drawn on-screen.
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
        numberEntryUnit: { type: String, default: null, trim: true },
        numberEntryMin: { type: Number, default: null },
        numberEntryMax: { type: Number, default: null },
        ratingScale: { type: Number, default: null },
        numericValue: { type: Number, default: null },
        options: [{ type: String, trim: true }],
        booleanAnswer: { type: String, enum: ["YES", "NO"], default: null },
        textValue: { type: String, default: null },
        dateValue: { type: Date, default: null },
        gpsTargetLat: { type: Number, default: null },
        gpsTargetLng: { type: Number, default: null },
        gpsRadiusMeters: { type: Number, default: null },
        gpsLat: { type: Number, default: null },
        gpsLng: { type: Number, default: null },
        gpsAccuracy: { type: Number, default: null },
        gpsCapturedAt: { type: Date, default: null },
        signatureLabels: [{ type: String, trim: true }],
        signatureValue: { type: String, default: null },
        secondSignatureValue: { type: String, default: null },
        qrExpectedValue: { type: String, default: null, trim: true },
        cashExpectedAmount: { type: Number, default: null },
        // Copied from the definition item at stamp-out — see checklistInstanceGenerator.job.ts.
        // conditionalReasonValue/issueId are instance-only (filled in as the conditional actions
        // actually fire, not authored) — see checklistInstance.service.ts's setItemDone.
        conditionalTrigger: { type: String, enum: ["YES", "NO"], default: null },
        conditionalActions: [{ type: String, enum: CHECKLIST_CONDITIONAL_ACTIONS }],
        conditionalReasonValue: { type: String, default: null },
        issueId: { type: Schema.Types.ObjectId, ref: "Ticket", default: null },
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
