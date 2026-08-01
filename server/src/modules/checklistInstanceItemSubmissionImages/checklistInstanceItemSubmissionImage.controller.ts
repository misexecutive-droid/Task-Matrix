import type { Request, Response } from "express"
import { checklistInstanceItemSubmissionImageService } from "./checklistInstanceItemSubmissionImage.service.js"
import { uploadChecklistInstanceItemSubmissionImageSchema } from "../checklistInstanceItemSubmissions/checklistInstanceItemSubmission.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const checklistInstanceItemSubmissionImageController = {
    // POST /checklist-instance-item-submissions/:id/images
    upload: asyncHandler(async (req: Request, res: Response) => {
        const { captureMethod } = uploadChecklistInstanceItemSubmissionImageSchema.parse(req.body)
        const files = (req.files as Express.Multer.File[]) ?? []
        const images = await checklistInstanceItemSubmissionImageService.upload(req.params.id, files, captureMethod, req.user!)
        res.status(201).json({ success: true, data: images })
    }),

    // DELETE /checklist-instance-item-submission-images/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await checklistInstanceItemSubmissionImageService.remove(req.params.id, req.user!)
        res.json({ success: true, data: { deleted: true } })
    }),
}
