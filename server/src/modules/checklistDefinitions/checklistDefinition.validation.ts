import { z } from "zod"
import { CHECKLIST_RECURRENCES } from "../../models/ChecklistDefinition.js"

const definitionItemShape = z.object({
    label: z.string().min(1),
    order: z.number().int().min(0).optional(),
})

export const createChecklistDefinitionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    departmentId: z.string().min(1),
    recurrence: z.enum(CHECKLIST_RECURRENCES),
    startDate: z.string(),
    assigneeIds: z.array(z.string().min(1)).min(1, "At least one assignee is required"),
    items: z.array(definitionItemShape).min(1, "At least one checklist item is required"),
})

export const setChecklistDefinitionActiveSchema = z.object({
    isActive: z.boolean(),
})

export type CreateChecklistDefinitionInput = z.infer<typeof createChecklistDefinitionSchema>
export type SetChecklistDefinitionActiveInput = z.infer<typeof setChecklistDefinitionActiveSchema>
