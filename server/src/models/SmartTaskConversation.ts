import { Schema, model } from "mongoose"

export const SMART_TASK_CONVERSATION_STATUSES = ["in_progress", "completed", "abandoned"] as const
export type SmartTaskConversationStatus = (typeof SMART_TASK_CONVERSATION_STATUSES)[number]

// One chat message from the Smart Add modal — mirrors the client's ChatMessage shape
// (SmartTaskModal.tsx). Embedded, not a separate collection, since a message is never queried or
// managed on its own, only ever read as part of its conversation.
const smartTaskConversationMessageSchema = new Schema(
    {
        from: { type: String, enum: ["bot", "user"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, required: true },
    },
    { _id: false },
)

// A full Smart Add chat, kept whether or not it ever resulted in a created task — "abandoned"
// covers a modal closed mid-conversation, so a user can find what they were saying even if they
// never finished. Separate collection from Task (not embedded on it) because a conversation may
// never produce a Task at all.
const smartTaskConversationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        messages: { type: [smartTaskConversationMessageSchema], default: [] },
        status: { type: String, enum: SMART_TASK_CONVERSATION_STATUSES, default: "in_progress" },
        resultingTaskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    },
    { timestamps: true },
)

// History list is always "my conversations, newest first".
smartTaskConversationSchema.index({ userId: 1, createdAt: -1 })

export const SmartTaskConversation = model("SmartTaskConversation", smartTaskConversationSchema)
