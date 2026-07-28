import { z } from "zod"

export const createCategorySchema = z.object({
    name : z.string().min(1),
    departmentId : z.string().min(1),
    assigneeIds : z.array(z.string()).optional(),
    tatHours : z.number().positive().nullable().optional(),
    isActive : z.boolean().optional()
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
