import { Router } from 'express';
import { checklistController } from './checklist.controller.js';
import { authenticate } from '../../middleware/auth/auth.js';

export const checklistRouter = Router();
checklistRouter.use(authenticate);
checklistRouter.delete('/:id', checklistController.removeChecklist);

export const checklistItemRouter = Router();
checklistItemRouter.use(authenticate);
checklistItemRouter.patch('/:id', checklistController.updateItem);
checklistItemRouter.delete('/:id', checklistController.removeItem);
