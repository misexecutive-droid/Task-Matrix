import { Schema, model } from "mongoose"

// General-purpose file attached directly to a Task — not tied to a checklist item, and not
// restricted to images. This is the "here's the spec doc / reference photo / walkthrough
// video for whoever does this task" case, separate from checklist items' own required-photo
// evidence flow (see TaskImage.ts).

const taskAttachmentSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },

        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

export const TaskAttachment = model("TaskAttachment", taskAttachmentSchema)
