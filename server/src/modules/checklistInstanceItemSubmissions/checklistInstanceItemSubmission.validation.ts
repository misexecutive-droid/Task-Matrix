import { z } from "zod"
import { CAPTURE_METHODS } from "../../models/TaskImage.js"

export const setChecklistInstanceItemSubmissionDoneSchema = z.object({
    isDone: z.boolean(),
})

export const updateChecklistInstanceItemSubmissionAccessoriesSchema = z.object({
    accessories: z.array(z.object({ name: z.string().min(1), checked: z.boolean() })),
})

export const updateChecklistInstanceItemSubmissionRemarksSchema = z.object({
    remarks: z.string().max(2000).nullable(),
})

// Same idea as checklistInstanceImages/checklistInstance.validation.ts's upload schema — the
// files themselves are validated by multer (config/upload.ts's
// checklistInstanceItemSubmissionImageUpload), this just validates the capture-method metadata
// riding alongside them.
export const uploadChecklistInstanceItemSubmissionImageSchema = z.object({
    captureMethod: z.enum(CAPTURE_METHODS),
})

export type SetChecklistInstanceItemSubmissionDoneInput = z.infer<typeof setChecklistInstanceItemSubmissionDoneSchema>
export type UpdateChecklistInstanceItemSubmissionAccessoriesInput = z.infer<typeof updateChecklistInstanceItemSubmissionAccessoriesSchema>
export type UpdateChecklistInstanceItemSubmissionRemarksInput = z.infer<typeof updateChecklistInstanceItemSubmissionRemarksSchema>
export type UploadChecklistInstanceItemSubmissionImageInput = z.infer<typeof uploadChecklistInstanceItemSubmissionImageSchema>
