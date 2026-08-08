import type { Request, Response } from "express"
import { ticketAttachmentService } from "./ticketAttachment.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const ticketAttachmentController = {
    upload: asyncHandler(async (req: Request, res: Response) => {
        const files = (req.files as Express.Multer.File[]) ?? [];
        const attachments = await ticketAttachmentService.upload(req.params.ticketId, files, req.user!);
        res.status(201).json({ success: true, data: attachments });
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
        await ticketAttachmentService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}
