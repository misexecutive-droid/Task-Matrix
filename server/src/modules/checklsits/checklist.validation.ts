import { z } from "zod"

export const createChecklistSchema = z.object({
    title : z.string().min(1),
    items : z.array(z.object ({ label : z.string().min(1)})).optional(),
})

export const updateChecklistItemSchema = z.object({
    label : z.string().min(1).optional(),
    isDone : z.boolean().optional(),
    assigneeId : z.string().regex(/^[0-9a-fA-F]$/).optional(),
    dueAt : z.string().datetime().optional()
})

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;