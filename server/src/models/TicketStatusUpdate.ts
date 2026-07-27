import { Schema, model } from "mongoose"

// Restricted set of statuses a non-verifier (the assignee/creator, or a manager) can move a
// ticket to through the "status update" flow — see ticket.validation.ts's statusUpdateSchema.
// Notably excludes OPEN and CLOSED: OPEN is never something you move back to, and CLOSED is
// PC/Admin-only (via ticketService.verify()).
export const RESTRICTED_STATUSES = ["IN_PROGRESS", "ON_HOLD", "IN_REVIEW"] as const
export type RestrictedStatus = (typeof RESTRICTED_STATUSES)[number]

// One record per status change made through the restricted flow — captures the mandatory
// remark (and whatever photos came with it) so the ticket detail view can show a real
// "user said X when moving to Y" history, instead of the change disappearing into thin air.
const ticketStatusUpdateSchema = new Schema(
    {
        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fromStatus: { type: String, required: true },
        toStatus: { type: String, enum: RESTRICTED_STATUSES, required: true },
        remark: { type: String, required: true, trim: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

// Virtual "photos": the evidence photos attached to this specific status change (see
// TicketAttachment.ts's statusUpdateId/captureMethod fields) — same "other way" populate
// shape used throughout this codebase (Ticket's "checklists"/"attachments" virtuals, etc).
ticketStatusUpdateSchema.virtual("photos", {
    ref: "TicketAttachment",
    localField: "_id",
    foreignField: "statusUpdateId",
})

export const TicketStatusUpdate = model("TicketStatusUpdate", ticketStatusUpdateSchema)
