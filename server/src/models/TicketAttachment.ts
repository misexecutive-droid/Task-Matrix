import { Schema, model } from "mongoose"
import { CAPTURE_METHODS } from "./TaskImage.js"

// General-purpose evidence/screenshot attached directly to a Ticket — distinct from
// ChecklistImage, which is scoped to one checklist item and gated by requiredImageCount/
// requiresLivePhoto. This is the plain "attach a screenshot to the ticket itself" case.

const ticketAttachmentSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },
        // How this photo was captured — set when it's attached through the status-update flow
        // (see TicketStatusUpdate.ts); plain ticket attachments default to GALLERY since there's
        // no live/gallery choice offered there.
        captureMethod: { type: String, enum: CAPTURE_METHODS, default: "GALLERY" },
        // Set only when this attachment came in alongside a status change — lets the status
        // history show which photos belong to which update, without duplicating storage.
        statusUpdateId: { type: Schema.Types.ObjectId, ref: "TicketStatusUpdate", default: null, index: true },

        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

export const TicketAttachment = model("TicketAttachment", ticketAttachmentSchema)
