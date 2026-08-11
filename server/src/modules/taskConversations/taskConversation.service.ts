import { PendingTaskConversation, type ConversationSlot } from "../../models/PendingTaskConversation.js"
import type { ConversationDraftLike } from "../tasks/ai/slotResolvers.js"

const CONVERSATION_TTL_MS = 30 * 60 * 1000

function isExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() <= Date.now()
}

// Mongo's TTL sweep runs on a ~60s cycle, so a logically-expired doc can still be read back in that
// window. Every lookup treats expiresAt<=now as "not found" and eagerly deletes, closing that gap —
// callers must never trust a doc returned here without this check having already run.
export async function findActiveConversation(phone: string) {
    const conversation = await PendingTaskConversation.findOne({ phone })
    if (!conversation) return null
    if (isExpired(conversation.expiresAt)) {
        await PendingTaskConversation.deleteOne({ _id: conversation._id })
        return null
    }
    return conversation
}

export async function startConversation(params: {
    phone: string
    userId: string
    firstSlot: ConversationSlot
    remainingSlots: ConversationSlot[]
    draft: ConversationDraftLike
}) {
    try {
        return await PendingTaskConversation.create({
            phone: params.phone,
            userId: params.userId,
            pendingSlot: params.firstSlot,
            slotQueue: params.remainingSlots,
            draft: params.draft,
            expiresAt: new Date(Date.now() + CONVERSATION_TTL_MS),
        })
    } catch (err: any) {
        // Two fresh messages from the same phone racing to start a conversation at once.
        if (err?.code === 11000) {
            const existing = await findActiveConversation(params.phone)
            if (existing) return existing
        }
        throw err
    }
}

type AdvanceResult =
    | { status: "next"; nextSlot: ConversationSlot }
    | { status: "done" }
    | { status: "raced" }

// Optimistic-concurrency guard keyed on the pendingSlot the caller read: if two answers to the same
// pending slot arrive concurrently, only the first write matches the filter — the second gets back
// "raced" and should stay silent rather than double-processing or double-creating a task.
export async function advanceConversation(
    conversation: { _id: unknown; pendingSlot: ConversationSlot; slotQueue: ConversationSlot[] },
    updatedDraft: ConversationDraftLike
): Promise<AdvanceResult> {
    const [nextSlot, ...remainingQueue] = conversation.slotQueue

    if (!nextSlot) {
        const result = await PendingTaskConversation.findOneAndUpdate(
            { _id: conversation._id, pendingSlot: conversation.pendingSlot },
            { draft: updatedDraft },
            { new: true }
        )
        return result ? { status: "done" } : { status: "raced" }
    }

    const result = await PendingTaskConversation.findOneAndUpdate(
        { _id: conversation._id, pendingSlot: conversation.pendingSlot },
        {
            pendingSlot: nextSlot,
            slotQueue: remainingQueue,
            draft: updatedDraft,
            expiresAt: new Date(Date.now() + CONVERSATION_TTL_MS),
        },
        { new: true }
    )
    return result ? { status: "next", nextSlot } : { status: "raced" }
}

export async function cancelConversation(phone: string) {
    await PendingTaskConversation.deleteOne({ phone })
}

export async function finishConversation(phone: string) {
    await PendingTaskConversation.deleteOne({ phone })
}
