import { z } from "zod"
import { objectId } from "../../utils/index.js"

export const createDepartmentSchema = z.object({
    name: z.string().min(1),
    isActive: z.boolean().optional(),
    storeId: objectId.optional(),
})

// storeId is overridden to also accept `null` (unlike create) so an admin can explicitly clear a
// department's store, not just set a new one — mirrors user.validation.ts's departmentId/storeId.
export const updateDepartmentSchema = createDepartmentSchema.omit({ storeId: true }).partial().extend({
    storeId: objectId.nullable().optional(),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
