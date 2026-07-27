import type { Request, Response } from "express"
import { ticketAttachmentService } from "./ticketAttachment.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const ticketAttachmentController = {
    // POST /tickets/:ticketId/attachments — multipart/form-data, handled by the
    // `ticketAttachmentUpload` multer middleware applied directly on the route (see ticket.routes.ts).
    upload: asyncHandler(async (req: Request, res: Response) => {
        const files = (req.files as Express.Multer.File[]) ?? [];
        const attachments = await ticketAttachmentService.upload(req.params.ticketId, files, req.user!);
        res.status(201).json({ success: true, data: attachments });
    }),

    // DELETE /ticket-attachments/:id
    remove: asyncHandler(async (req: Request, res: Response) => {
        await ticketAttachmentService.remove(req.params.id, req.user!);
        res.json({ success: true, data: { deleted: true } });
    }),
}
