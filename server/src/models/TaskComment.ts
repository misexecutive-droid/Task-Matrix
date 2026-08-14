import { Schema, model } from "mongoose"

// A single message in a Task's activity/comment feed. Attachments and a shared location are
// embedded directly on the comment (not a separate collection) since neither is ever queried or
// managed on its own — they only ever make sense in the context of the comment they belong to.

const taskCommentAttachmentSchema = new Schema(
    {
        url: { type: String, required: true },
        originalFilename: { type: String, default: null },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
    },
    { _id: false },
)

const taskCommentLocationSchema = new Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        label: { type: String, default: null },
    },
    { _id: false },
)

const taskCommentSchema = new Schema(
    {
        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        body: { type: String, default: "" },
        attachments: { type: [taskCommentAttachmentSchema], default: [] },
        location: { type: taskCommentLocationSchema, default: null },
    },
    { timestamps: true },
)

taskCommentSchema.index({ taskId: 1, createdAt: 1 })

export const TaskComment = model("TaskComment", taskCommentSchema)
