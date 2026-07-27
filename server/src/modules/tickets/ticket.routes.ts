import { Router } from 'express';
import { ticketController } from './ticket.controller.js';
import { checklistController } from '../checklists/checklist.controller.js';
import { ticketAttachmentController } from '../ticketAttachments/ticketAttachment.controller.js';
import { ticketAttachmentUpload } from '../../config/upload.js';
import { ticketCommentController } from '../ticketComments/ticketComment.controller.js';
import { authenticate, requireRole } from '../../middleware/auth/auth.js';

export const ticketRouter = Router();

ticketRouter.use(authenticate);
ticketRouter.get('/', ticketController.list);
ticketRouter.get('/reports/tat', requireRole('ADMIN'), ticketController.tatReport); // NEW — see Part B
ticketRouter.get('/:id', ticketController.getOne);
// Any authenticated user can raise a ticket — this is the "I have an issue, please fix it" entry
// point, not an admin-only dispatch tool. ticketService.create() stamps userId from the token
// regardless of role, so there's no admin-specific behavior being skipped here.
ticketRouter.post('/', ticketController.create);
ticketRouter.patch('/:id', ticketController.update);
ticketRouter.post('/:id/status-updates', ticketAttachmentUpload, ticketController.addStatusUpdate);
ticketRouter.patch('/:id/verify', requireRole('PC', 'ADMIN'), ticketController.verify);
ticketRouter.delete('/:id', requireRole('ADMIN'), ticketController.remove);

ticketRouter.post('/:ticketId/checklists', requireRole('ADMIN'), checklistController.addToTicket);
ticketRouter.post('/:ticketId/checklists/from-template/:templateId', requireRole('ADMIN'), checklistController.addFromTemplateToTicket);

ticketRouter.post('/:ticketId/attachments', ticketAttachmentUpload, ticketAttachmentController.upload);

ticketRouter.post('/:ticketId/comments', ticketCommentController.create);