import { z } from "zod"
import { CHECKLIST_RECURRENCES, CHECKLIST_ASSIGNEE_ROLES, CHECKLIST_ICONS, CHECKLIST_PROOF_TYPES } from "../../models/ChecklistDefinition.js"
import { CHECKLIST_ITEM_TYPES, CHECKLIST_CONDITIONAL_ACTIONS } from "../../models/ChecklistDefinitionItem.js"

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:mm")

const definitionItemShape = z.object({
    label: z.string().min(1),
    order: z.number().int().min(0).optional(),
    requiredImageCount: z.number().int().min(0).optional(),
    maxImageCount: z.number().int().min(0).nullable().optional(),
    requiresLivePhoto: z.boolean().optional(),
    itemType: z.enum(CHECKLIST_ITEM_TYPES).optional(),
    auditUserIds: z.array(z.string().min(1)).optional(),
    accessories: z.array(z.string().min(1)).optional(),
    numberEntryUnit: z.string().trim().min(1).nullable().optional(),
    numberEntryMin: z.number().nullable().optional(),
    numberEntryMax: z.number().nullable().optional(),
    ratingScale: z.number().int().min(2).max(10).nullable().optional(),
    options: z.array(z.string().min(1)).optional(),
    gpsTargetLat: z.number().min(-90).max(90).nullable().optional(),
    gpsTargetLng: z.number().min(-180).max(180).nullable().optional(),
    gpsRadiusMeters: z.number().min(1).nullable().optional(),
    signatureLabels: z.array(z.string().min(1)).optional(),
    qrExpectedValue: z.string().trim().min(1).nullable().optional(),
    cashExpectedAmount: z.number().nullable().optional(),
    conditionalTrigger: z.enum(["YES", "NO"]).nullable().optional(),
    conditionalActions: z.array(z.enum(CHECKLIST_CONDITIONAL_ACTIONS)).optional(),
}).refine(item => item.itemType !== "AUDIT" || (item.auditUserIds?.length ?? 0) >= 1, {
    message: "At least one auditor is required for an audit item",
    path: ["auditUserIds"],
}).refine(item => item.numberEntryMin == null || item.numberEntryMax == null || item.numberEntryMin <= item.numberEntryMax, {
    message: "Minimum must be less than or equal to maximum",
    path: ["numberEntryMax"],
}).refine(item => !["MULTIPLE_CHOICE", "DROPDOWN"].includes(item.itemType ?? "") || (item.options?.length ?? 0) >= 2, {
    message: "At least two options are required",
    path: ["options"],
}).refine(item => item.gpsRadiusMeters == null || (item.gpsTargetLat != null && item.gpsTargetLng != null), {
    message: "A target location is required when a radius is set",
    path: ["gpsRadiusMeters"],
}).refine(item => item.itemType !== "VIDEO_UPLOAD" || (item.requiredImageCount ?? 0) >= 1, {
    message : "At least on video is required fro video upload item",
    path : ["requiredImageCount"],
}).refine(item => !item.conditionalTrigger || ["YES_NO", "PASS_FAIL"].includes(item.itemType ?? ""), {
    message: "Conditional rules only apply to Yes/No or Pass/Fail items",
    path: ["conditionalTrigger"],
}).refine(item => !(item.conditionalActions?.length) || !!item.conditionalTrigger, {
    message: "Select a trigger answer (Yes/No) before adding conditional actions",
    path: ["conditionalTrigger"],
})


const checklistDefinitionFields = {
    name: z.string().min(1),
    description: z.string().optional(),
    storeIds: z.array(z.string().min(1)).min(1, "At least one store is required"),
    recurrence: z.enum(CHECKLIST_RECURRENCES),
    startDate: z.string(),
    opensTime: timeOfDay.optional(),
    cutoffTime: timeOfDay.optional(),
    assigneeIds: z.array(z.string().min(1)).min(1, "At least one assignee is required"),
    assigneeRoles: z.array(z.enum(CHECKLIST_ASSIGNEE_ROLES)).optional(),
    proofRequired: z.array(z.enum(CHECKLIST_PROOF_TYPES)).optional(),
    icon: z.enum(CHECKLIST_ICONS).optional(),
    items: z.array(definitionItemShape).min(1, "At least one checklist item is required"),
}

export const createChecklistDefinitionSchema = z.object(checklistDefinitionFields)

// Same shape as create — Builder's edit mode replaces name/schedule/items wholesale rather than
// patching individual fields, so there's no partial-update variant to maintain separately.
export const updateChecklistDefinitionSchema = z.object(checklistDefinitionFields)

export const setChecklistDefinitionActiveSchema = z.object({
    isActive: z.boolean(),
})

export type CreateChecklistDefinitionInput = z.infer<typeof createChecklistDefinitionSchema>
export type UpdateChecklistDefinitionInput = z.infer<typeof updateChecklistDefinitionSchema>
export type SetChecklistDefinitionActiveInput = z.infer<typeof setChecklistDefinitionActiveSchema>
