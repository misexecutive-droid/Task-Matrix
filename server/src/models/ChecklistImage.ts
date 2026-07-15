import { Schema, model } from "mongoose"
import { CAPTURE_METHODS } from "./TaskImage.js"

// Ticket-side equivalent of TaskImage.ts — same shape, but evidence photos live under a
// ticket's ChecklistItem instead of a task's TaskChecklistItem. See TaskImage.ts for the
// reasoning behind each field (random filenames, captureMethod, etc).

const checklistImageSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },
        captureMethod: { type: String, enum: CAPTURE_METHODS, required: true },

        checklistItemId: { type: Schema.Types.ObjectId, ref: "ChecklistItem", required: true, index: true },

        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const ChecklistImage = model("ChecklistImage", checklistImageSchema)