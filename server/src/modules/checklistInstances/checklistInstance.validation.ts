import { z } from "zod"

export const setChecklistInstanceItemDoneSchema = z.object({
    isDone: z.boolean(),
})

export type SetChecklistInstanceItemDoneInput = z.infer<typeof setChecklistInstanceItemDoneSchema>
