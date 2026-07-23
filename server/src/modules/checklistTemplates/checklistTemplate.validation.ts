import { z } from "zod"
import { CHECKLIST_TEMPLATE_TARGETS } from "../../models/ChecklistTemplate.js"

const templateItemShape = z.object({
    label: z.string().min(1),
    order: z.number().int().min(0).optional(),
    requiredImageCount: z.number().int().min(0).optional(),
    maxImageCount: z.number().int().min(0).optional(),
    requiresLivePhoto: z.boolean().optional(),
    // Seed value for the created checklist item's assigneeId when the template is applied —
    // expected to be a user within the template's departmentId, though this isn't enforced
    // server-side (the client already scopes the picker to that department).
    defaultAssigneeId: z.string().min(1).optional(),
})

export const createChecklistTemplateSchema = z.object({
    name: z.string().min(1),
    appliesTo: z.enum(CHECKLIST_TEMPLATE_TARGETS),
    // Optional — scopes which users can be picked as an item's defaultAssigneeId.
    departmentId: z.string().min(1).optional(),
    items: z.array(templateItemShape).optional(),
})

// Renaming a template, or changing its department — appliesTo is set once at creation and never
// changes (switching a template between Task/Ticket would leave any already-applied checklists
// meaningless).
export const updateChecklistTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    departmentId: z.string().min(1).nullable().optional(),
})

export const createChecklistTemplateItemSchema = templateItemShape

export const updateChecklistTemplateItemSchema = z.object({
    label: z.string().min(1).optional(),
    order: z.number().int().min(0).optional(),
    requiredImageCount: z.number().int().min(0).optional(),
    maxImageCount: z.number().int().min(0).nullable().optional(),
    requiresLivePhoto: z.boolean().optional(),
    defaultAssigneeId: z.string().min(1).nullable().optional(),
})

export type CreateChecklistTemplateInput = z.infer<typeof createChecklistTemplateSchema>
export type UpdateChecklistTemplateInput = z.infer<typeof updateChecklistTemplateSchema>
export type CreateChecklistTemplateItemInput = z.infer<typeof createChecklistTemplateItemSchema>
export type UpdateChecklistTemplateItemInput = z.infer<typeof updateChecklistTemplateItemSchema>