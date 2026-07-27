import { z } from "zod"

export const createCommentSchema = z.object({
    body: z.string().trim().min(1, "Comment can't be empty").max(2000, "Comment is too long"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
