import { Router } from 'express';
import { ticketController } from './ticket.controller.js';
import { checklistController } from '../checklists/checklist.controller.js';
import { authenticate, requireRole } from '../../middleware/auth/auth.js';

export const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.get('/', ticketController.list);
ticketRouter.get('/:id', ticketController.getOne);
ticketRouter.post('/', ticketController.create);
ticketRouter.patch('/:id', ticketController.update);
ticketRouter.delete('/:id', requireRole('ADMIN'), ticketController.remove);

ticketRouter.post('/:ticketId/checklists', checklistController.addToTicket);
