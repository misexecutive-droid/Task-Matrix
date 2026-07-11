import type { Request, Response } from "express"
import { taskImageService } from "./taskImage.service.js"
import { uploadImageSchema } from "./taskImage.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const taskImageController = {
    // POST /task-checklist-items/:id/images — multipart/form-data, handled by the
    // `taskImageUpload` multer middleware applied directly on the route (see taskChecklist.routes.ts).
    upload: asyncHandler(async (req: Request, res: Response) => {
        const { captureMethod } = uploadImageSchema.parse(req.body);
        const files = (req.files as Express.Multer.File[]) ?? [];
        const images = await taskImageService.upload(req.params.id, files, captureMethod, req.user!);
        res.status(201).json({ success: true, data: images });
    }),

    // DELETE /task-images/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await taskImageService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}