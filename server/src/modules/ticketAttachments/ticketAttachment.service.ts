import path from "node:path";
import fs from "node:fs";
import { Ticket } from "../../models/Ticket.js";
import { TicketAttachment } from "../../models/TicketAttachment.js";
import { AppError } from "../../utils/AppError.js";
import type { AccessTokenPayload } from "../../middleware/auth/auth.js";

const assertCanAttach = (user: AccessTokenPayload, ticket: any) => {
    if (user.role === "ADMIN" || user.role === "PC" || user.role === "MANAGER") return;
    if (String(ticket.userId) === user.sub) return;
    if (ticket.assigneeId && String(ticket.assigneeId) === user.sub) return;
    throw AppError.forbidden("You don't have access to this ticket's attachments");
};

export const ticketAttachmentService = {
    async upload(ticketId: string, files: Express.Multer.File[], user: AccessTokenPayload) {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) throw AppError.notFound("Ticket not found");
        assertCanAttach(user, ticket);

        if (!files.length) {
            throw AppError.badRequest("No valid image files were received (check file type and size)");
        }

        return TicketAttachment.insertMany(
            files.map((file) => ({
                url: `/uploads/ticket-attachments/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                ticketId: ticket._id,
                uploadedBy: user.sub,
            })),
        );
    },

    async remove(attachmentId: string, user: AccessTokenPayload) {
        const attachment = await TicketAttachment.findById(attachmentId);
        if (!attachment) throw AppError.notFound("Attachment not found");

        const ticket = await Ticket.findById(attachment.ticketId);
        if (ticket) assertCanAttach(user, ticket);

        const absolutePath = path.resolve(process.cwd(), "uploads", "ticket-attachments", path.basename(attachment.url));
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete attachment file from disk:", err);
        });

        await attachment.deleteOne();
        return attachment;
    },
};
