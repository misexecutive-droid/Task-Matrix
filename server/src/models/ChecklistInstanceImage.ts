import { Schema, model } from "mongoose"
import { CAPTURE_METHODS } from "./TaskImage.js"

// Recurring-checklist-instance equivalent of ChecklistImage.ts — same shape, but evidence
// photos live under a ChecklistInstanceItem instead of a ticket's ChecklistItem. See TaskImage.ts
// for the reasoning behind each field (random filenames, captureMethod, etc).

const checklistInstanceImageSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },
        captureMethod: { type: String, enum: CAPTURE_METHODS, required: true },

        checklistInstanceItemId: { type: Schema.Types.ObjectId, ref: "ChecklistInstanceItem", required: true, index: true },

        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const ChecklistInstanceImage = model("ChecklistInstanceImage", checklistInstanceImageSchema)
