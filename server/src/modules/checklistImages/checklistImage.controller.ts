import type { Request, Response } from "express"
import { checklistImageService } from "./checklistImage.service.js"
import { uploadImageSchema } from "./checklistImage.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const checklistImageController = {
    // POST /checklist-items/:id/images — multipart/form-data, handled by the
    // `checklistImageUpload` multer middleware applied directly on the route (see checklist.routes.ts).
    upload: asyncHandler(async (req: Request, res: Response) => {
        const { captureMethod } = uploadImageSchema.parse(req.body);
        const files = (req.files as Express.Multer.File[]) ?? [];
        const images = await checklistImageService.upload(req.params.id, files, captureMethod, req.user!);
        res.status(201).json({ success: true, data: images });
    }),

    // DELETE /checklist-images/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await checklistImageService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}