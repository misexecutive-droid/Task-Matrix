import type { Request, Response } from "express"
import { taskAttachmentService } from "./taskAttachment.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const taskAttachmentController = {
    // POST /tasks/:id/attachments — multipart/form-data, handled by the `taskAttachmentUpload`
    // multer middleware applied directly on the route (see task.routes.ts).
    upload: asyncHandler(async (req: Request, res: Response) => {
        const files = (req.files as Express.Multer.File[]) ?? [];
        const attachments = await taskAttachmentService.upload(req.params.id, files, req.user!);
        res.status(201).json({ success: true, data: attachments });
    }),

    // DELETE /task-attachments/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await taskAttachmentService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}
