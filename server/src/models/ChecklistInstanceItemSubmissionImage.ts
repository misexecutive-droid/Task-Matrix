import { Schema, model } from "mongoose"
import { CAPTURE_METHODS } from "./TaskImage.js"

// Evidence photo attached to one auditor's ChecklistInstanceItemSubmission — identical shape to
// ChecklistInstanceImage.ts, just keyed by submissionId instead of checklistInstanceItemId, since
// an AUDIT item's photos belong to one specific auditor's submission, not a pool shared by the
// whole item. See TaskImage.ts for the reasoning behind each field.

const checklistInstanceItemSubmissionImageSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },
        captureMethod: { type: String, enum: CAPTURE_METHODS, required: true },

        submissionId: { type: Schema.Types.ObjectId, ref: "ChecklistInstanceItemSubmission", required: true, index: true },

        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const ChecklistInstanceItemSubmissionImage = model("ChecklistInstanceItemSubmissionImage", checklistInstanceItemSubmissionImageSchema)
