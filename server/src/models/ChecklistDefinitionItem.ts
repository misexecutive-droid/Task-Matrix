import { Schema, model } from "mongoose"

export const CHECKLIST_ITEM_TYPES = [
    "STANDARD", "AUDIT", "NUMBER_ENTRY", "RATING",
    "YES_NO", "PASS_FAIL", "MULTIPLE_CHOICE", "DROPDOWN", "TEXT_BOX", "DATE_TIME",
    "GPS", "SIGNATURE", "DUAL_SIGNATURE", "QR_SCAN", "CASH_TALLY", "VIDEO_UPLOAD",
] as const
export type ChecklistItemType = (typeof CHECKLIST_ITEM_TYPES)[number]

// Actions that fire when a YES_NO/PASS_FAIL item's answer matches conditionalTrigger — authored
// per-item in the Builder's "If answer is X then:" panel, enforced by checklistInstance.service.ts's
// setItemDone. REQUIRE_PHOTO bumps the effective minimum photo count to at least 1 for that one
// submission even if requiredImageCount is 0 otherwise; ASK_REASON requires a free-text answer
// (ChecklistInstanceItem.conditionalReasonValue); CREATE_ISSUE opens a Ticket referencing the
// instance/item (ChecklistInstanceItem.issueId, created at most once); NOTIFY_AREA_MANAGER is a
// best-effort notification to every ADMIN user — the app has no separate "area manager" role today,
// so ADMIN (the closest existing escalation contact) stands in for it.
export const CHECKLIST_CONDITIONAL_ACTIONS = [
    "REQUIRE_PHOTO", "ASK_REASON", "CREATE_ISSUE", "NOTIFY_AREA_MANAGER",
] as const
export type ChecklistConditionalAction = (typeof CHECKLIST_CONDITIONAL_ACTIONS)[number]

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
//
// itemType "NUMBER_ENTRY" replaces the checkbox with a numeric reading (e.g. a cash-drawer
// tally) — numberEntryUnit/Min/Max are authored here once and copied onto every generated
// ChecklistInstanceItem the same way the photo fields are; the actual value entered per-run
// lives on ChecklistInstanceItem.numericValue, not here.
//
// itemType "RATING" reuses that same numericValue slot for a 1..ratingScale star rating instead
// of a free-form reading — ratingScale (how many stars) is the only config it needs, authored
// here and copied the same way.
//
// itemType "YES_NO"/"PASS_FAIL" store a plain two-way answer on ChecklistInstanceItem.
// booleanAnswer — same field for both, "PASS_FAIL" just relabels YES/NO as Pass/Fail in the UI,
// since the underlying question ("did this pass?") is identical.
//
// itemType "MULTIPLE_CHOICE"/"DROPDOWN" both pick one of `options` (authored here, copied onto
// the instance item the same way accessories is) into ChecklistInstanceItem.textValue — they
// differ only in the picker widget (chip list vs a native <select>), not the data shape.
// itemType "TEXT_BOX" reuses that same textValue slot for a free-form answer, with no options.
//
// itemType "DATE_TIME" stores its answer on ChecklistInstanceItem.dateValue.
//
// itemType "GPS" captures the assignee's device location — gpsTargetLat/Lng/RadiusMeters are all
// optional here; leaving them unset means "just capture where you are," while setting all three
// means the captured point must fall within that radius of the target. The actual reading
// (gpsLat/Lng/Accuracy) lives on ChecklistInstanceItem, checked by checklistInstance.service.ts.
//
// itemType "SIGNATURE"/"DUAL_SIGNATURE" capture a finger/stylus signature drawn on-screen as a
// PNG data URL, stored directly on ChecklistInstanceItem.signatureValue (and secondSignatureValue
// for the second signer) rather than through the ChecklistInstanceImage upload pipeline — it's a
// small drawing, not a camera photo, so it doesn't need multer/disk storage. signatureLabels names
// who signs (e.g. ["Employee", "Supervisor"] for DUAL_SIGNATURE); left empty, the UI falls back to
// generic labels.
//
// itemType "QR_SCAN" stores the scanned code in that same textValue slot TEXT_BOX uses.
// qrExpectedValue is optional — set it to require a specific code, leave it unset to accept any
// scan as satisfying the item.
//
// itemType "CASH_TALLY" is a NUMBER_ENTRY variant that also shows the assignee an expected amount
// to reconcile against — it reuses numericValue/numberEntryUnit/Min/Max exactly as NUMBER_ENTRY
// does (down to sharing its validator), with cashExpectedAmount as the one additional field for
// computing a displayed variance.
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
        numberEntryUnit: { type: String, default: null, trim: true },
        numberEntryMin: { type: Number, default: null },
        numberEntryMax: { type: Number, default: null },
        ratingScale: { type: Number, default: null, min: 2, max: 10 },
        options: [{ type: String, trim: true }],
        gpsTargetLat: { type: Number, default: null },
        gpsTargetLng: { type: Number, default: null },
        gpsRadiusMeters: { type: Number, default: null, min: 1 },
        signatureLabels: [{ type: String, trim: true }],
        qrExpectedValue: { type: String, default: null, trim: true },
        cashExpectedAmount: { type: Number, default: null },
        conditionalTrigger: { type: String, enum: ["YES", "NO"], default: null },
        conditionalActions: [{ type: String, enum: CHECKLIST_CONDITIONAL_ACTIONS }],
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
    },
    { timestamps: true },
)

export const ChecklistDefinitionItem = model("ChecklistDefinitionItem", checklistDefinitionItemSchema)
