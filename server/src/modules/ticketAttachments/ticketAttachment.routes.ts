import { Router } from "express"
import { ticketAttachmentController } from "./ticketAttachment.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /ticket-attachments in app.ts
export const ticketAttachmentRouter = Router()
ticketAttachmentRouter.use(authenticate)
ticketAttachmentRouter.delete('/:id', ticketAttachmentController.remove)
