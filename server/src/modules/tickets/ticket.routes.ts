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
ticketRouter.get('/reports/tat', requireRole('ADMIN', 'PC'), ticketController.tatReport); // NEW — see Part B
ticketRouter.get('/:id', ticketController.getOne);

ticketRouter.post('/', ticketController.create);
ticketRouter.patch('/:id', ticketController.update);
ticketRouter.post('/:id/status-updates', ticketAttachmentUpload, ticketController.addStatusUpdate);
ticketRouter.patch('/:id/verify', requireRole('PC', 'ADMIN'), ticketController.verify);
ticketRouter.delete('/:id', requireRole('ADMIN', 'PC'), ticketController.remove);

ticketRouter.post('/:ticketId/checklists', requireRole('ADMIN', 'PC'), checklistController.addToTicket);
ticketRouter.post('/:ticketId/checklists/from-template/:templateId', requireRole('ADMIN', 'PC'), checklistController.addFromTemplateToTicket);

ticketRouter.post('/:ticketId/attachments', ticketAttachmentUpload, ticketAttachmentController.upload);

ticketRouter.post('/:ticketId/comments', ticketCommentController.create);