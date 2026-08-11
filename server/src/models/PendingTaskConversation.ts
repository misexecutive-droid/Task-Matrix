import { Schema, model } from "mongoose"

export const CONVERSATION_SLOTS = ["assignee", "department", "dueDate", "priority"] as const
export type ConversationSlot = (typeof CONVERSATION_SLOTS)[number]

const conversationDraftSchema = new Schema(
    {
        title: { type: String, required: true },
        context: { type: String, default: "" },
        category: { type: String, enum: ["issue", "delegated_task"], required: true },
        priority: { type: String, enum: ["low", "medium", "high"], required: true },
        dueDate: { type: Date, default: null },
        assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        assigneeName: { type: String, default: "" },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
        departmentName: { type: String, default: "" },
        rawInput: { type: String, required: true },
        inputMode: { type: String, enum: ["voice", "text"], required: true },
        confidence: { type: Number, default: null },
        wonBy: { type: String, default: null },
    },
    { _id: false }
)

const pendingTaskConversationSchema = new Schema(
    {
        phone: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        channel: { type: String, enum: ["whatsapp"], default: "whatsapp" },
        pendingSlot: { type: String, enum: CONVERSATION_SLOTS, required: true },
        slotQueue: { type: [{ type: String, enum: CONVERSATION_SLOTS }], default: [] },
        draft: { type: conversationDraftSchema, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
)

// Sliding-window expiry: expiresAt is recomputed to now+30min on every turn (see
// taskConversation.service.ts), so this must be an absolute-instant TTL index (expireAfterSeconds:0),
// not a fixed offset from createdAt — Mongo's TTL sweep runs on a ~60s cycle, so callers also
// eagerly delete expired docs at read time rather than trusting the sweep alone.
pendingTaskConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const PendingTaskConversation = model("PendingTaskConversation", pendingTaskConversationSchema)
