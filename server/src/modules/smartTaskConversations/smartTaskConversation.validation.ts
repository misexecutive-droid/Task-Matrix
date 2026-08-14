import { z } from "zod"
import { SMART_TASK_CONVERSATION_STATUSES } from "../../models/SmartTaskConversation.js"

const messageSchema = z.object({
    from: z.enum(["bot", "user"]),
    text: z.string(),
    timestamp: z.union([z.string(), z.number()]),
})

export const createSmartTaskConversationSchema = z.object({
    messages: z.array(messageSchema).min(1),
})

export const patchSmartTaskConversationSchema = z.object({
    messages: z.array(messageSchema).optional(),
    status: z.enum(SMART_TASK_CONVERSATION_STATUSES).optional(),
    resultingTaskId: z.string().optional(),
})

export type CreateSmartTaskConversationInput = z.infer<typeof createSmartTaskConversationSchema>
export type PatchSmartTaskConversationInput = z.infer<typeof patchSmartTaskConversationSchema>
