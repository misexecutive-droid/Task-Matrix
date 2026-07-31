import type { Request, Response } from "express"
import { checklistInstanceImageService } from "./checklistInstanceImage.service.js"
import { uploadChecklistInstanceImageSchema } from "../checklistInstances/checklistInstance.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const checklistInstanceImageController = {
    // POST /checklist-instance-items/:id/images — multipart/form-data, handled by the
    // `checklistInstanceImageUpload` multer middleware applied directly on the route (see
    // checklistInstance.routes.ts).
    upload: asyncHandler(async (req: Request, res: Response) => {
        const { captureMethod } = uploadChecklistInstanceImageSchema.parse(req.body);
        const files = (req.files as Express.Multer.File[]) ?? [];
        const images = await checklistInstanceImageService.upload(req.params.id, files, captureMethod, req.user!);
        res.status(201).json({ success: true, data: images });
    }),

    // DELETE /checklist-instance-images/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await checklistInstanceImageService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}
