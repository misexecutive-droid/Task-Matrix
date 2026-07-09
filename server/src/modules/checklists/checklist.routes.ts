// Express's Router lets us group related endpoints (like a mini "sub-app").
import { Router } from 'express';
// The controller holds the actual request-handling logic for checklists/items.
import { checklistController } from './checklist.controller.js';
// Middleware that checks the request has a valid logged-in user before letting it through.
import { authenticate } from '../../middleware/auth/auth.js';

// Router for actions on a whole Checklist (the "parent" that lives under a Ticket).
// Note: creating a checklist happens on the TICKET's own router (nested route, e.g. /tickets/:ticketId/checklists),
// which is why you don't see an "add" route here - only routes that act on an existing checklist by its own id.
export const checklistRouter = Router();
// Every route on this router requires the user to be logged in first.
checklistRouter.use(authenticate);
// DELETE /:id -> delete an entire checklist (and, per the service, all of its items too).
checklistRouter.delete('/:id', checklistController.removeChecklist);

// Router for actions on individual ChecklistItems (the "children" that belong to a Checklist).
export const checklistItemRouter = Router();
// Same authentication requirement for item-level routes.
checklistItemRouter.use(authenticate);
// PATCH /:id -> update one checklist item (e.g. mark it done, change its label/assignee/due date).
checklistItemRouter.patch('/:id', checklistController.updateItem);
// DELETE /:id -> delete a single checklist item (does not touch the rest of the checklist).
checklistItemRouter.delete('/:id', checklistController.removeItem);
