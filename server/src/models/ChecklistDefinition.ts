import { Schema, model } from "mongoose"

export const CHECKLIST_RECURRENCES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const
export type ChecklistRecurrence = (typeof CHECKLIST_RECURRENCES)[number]

// Job functions a checklist can be assigned to at a store, independent of the app's system Role
// (ADMIN/MANAGER/AGENT/USER/PC) used for permissions — this is "who does this at the store"
// metadata for display and future auto-assignment, not an auth check.
export const CHECKLIST_ASSIGNEE_ROLES = [
    "STORE_MANAGER", "FLOOR_MANAGER", "CASHIER", "SECURITY", "HOUSEKEEPING", "OPERATIONS",
] as const
export type ChecklistAssigneeRole = (typeof CHECKLIST_ASSIGNEE_ROLES)[number]

// Purely cosmetic — which lucide icon the Templates grid renders on this checklist's card.
export const CHECKLIST_ICONS = [
    "store", "clock", "star", "check", "shield", "alert-triangle", "hash", "shield-check", "calendar",
] as const
export type ChecklistIcon = (typeof CHECKLIST_ICONS)[number]

// Kinds of proof the Builder's "Proof Required" panel can flag as expected across this
// checklist's items — descriptive/rollup for now (surfaced on the instance UI), not a separate
// validation layer: the real per-item enforcement already lives on each ChecklistDefinitionItem
// (requiredImageCount, gpsTarget*, signatureLabels, qrExpectedValue) and is checked by
// checklistInstance.service.ts's setItemDone regardless of what's toggled here.
export const CHECKLIST_PROOF_TYPES = ["PHOTO", "GPS_MATCH", "TIMESTAMP", "SIGNATURE", "QR_SCAN"] as const
export type ChecklistProofType = (typeof CHECKLIST_PROOF_TYPES)[number]

// HH:mm, e.g. "09:30" — validated in checklistDefinition.validation.ts.
const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const checklistDefinitionSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: null },
        // A definition can be deployed to several stores at once (e.g. "live in 6 stores") — each
        // store gets its own independently-generated ChecklistInstance per period, see
        // jobs/checklistInstanceGenerator.job.ts.
        storeIds: [{ type: Schema.Types.ObjectId, ref: "Store", required: true }],
        recurrence: { type: String, enum: CHECKLIST_RECURRENCES, required: true },
        startDate: { type: Date, required: true },
        // Time-of-day window each generated instance is expected to run within — "Opens" is when
        // the assignee can start; "Cut-off" is when it's considered overdue. Both optional (a
        // checklist with no explicit window is always open). Escalation-ladder behavior after
        // cut-off is Today's Runs' concern, not modeled here yet.
        opensTime: { type: String, default: null, match: TIME_OF_DAY_REGEX },
        cutoffTime: { type: String, default: null, match: TIME_OF_DAY_REGEX },
        isActive: { type: Boolean, default: true },
        assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        // Descriptive-only for now — which store job function(s) this checklist is meant for
        // (shown on the Templates grid, e.g. "Daily · Store Manager"). Doesn't yet drive
        // auto-assignment; assigneeIds above remains the actual mechanism for who gets an instance.
        assigneeRoles: [{ type: String, enum: CHECKLIST_ASSIGNEE_ROLES }],
        proofRequired: [{ type: String, enum: CHECKLIST_PROOF_TYPES }],
        icon: { type: String, enum: CHECKLIST_ICONS, default: "store" },
        // Bumped on every edit to this definition's items/schedule — surfaced as "v3" etc. on the
        // Templates grid.
        version: { type: Number, default: 1 },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistDefinitionSchema.path("storeIds").validate(
    (value: unknown[]) => value.length >= 1,
    "At least one store is required",
)

checklistDefinitionSchema.virtual("items", {
    ref: "ChecklistDefinitionItem",
    localField: "_id",
    foreignField: "definitionId",
})

export const ChecklistDefinition = model("ChecklistDefinition", checklistDefinitionSchema)
