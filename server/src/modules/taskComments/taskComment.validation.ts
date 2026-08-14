import { z } from "zod"

export const createTaskCommentSchema = z.object({
    body: z.string().trim().max(4000).optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        label: z.string().optional(),
    }).optional(),
})

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>
