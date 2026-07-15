import { z } from "zod"

export const updateSettingsSchema = z.object({
    defaultTatHours : z.number().positive().optional(),
    maxUploadSizeMb : z.number().positive().optional(),
    maxUploadFiles : z.number().int().optional().optional(),
    allowedImageTypes : z.array(z.string().min(1).optional())
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>