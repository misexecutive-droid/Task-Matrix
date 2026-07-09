// Import Express's Router so we can define a set of ticket-related routes separately from the main app.
import { Router } from 'express';
// Import the controller functions that actually handle each ticket route (list/create/update/etc).
import { ticketController } from './ticket.controller.js';
// Import the checklist controller too, because tickets can have checklists attached to them.
import { checklistController } from '../checklists/checklist.controller.js';
// authenticate = middleware that checks the user is logged in (valid JWT). requireRole = middleware that checks the user has a specific role (e.g. ADMIN) before letting the request through.
import { authenticate, requireRole } from '../../middleware/auth/auth.js';

// Create a dedicated Router instance just for "/tickets" style routes. This gets mounted onto the main app elsewhere (probably app.use('/tickets', ticketRouter)).
export const ticketRouter = Router();

// Apply the `authenticate` middleware to every route defined below on this router.
// This means you must be logged in (have a valid access token) to hit ANY ticket route.
ticketRouter.use(authenticate);

// GET /tickets -> list tickets (filtered by what the logged-in user is allowed to see, handled in the controller/service).
ticketRouter.get('/', ticketController.list);
// GET /tickets/:id -> fetch a single ticket by its Mongo _id.
ticketRouter.get('/:id', ticketController.getOne);
// POST /tickets -> create a brand new ticket.
ticketRouter.post('/', ticketController.create);
// PATCH /tickets/:id -> partially update an existing ticket (e.g. change status, reassign it).
ticketRouter.patch('/:id', ticketController.update);
// DELETE /tickets/:id -> delete a ticket, but only if the user's role is ADMIN (requireRole('ADMIN') runs before the controller and blocks anyone else with a 403).
ticketRouter.delete('/:id', requireRole('ADMIN'), ticketController.remove);

// POST /tickets/:ticketId/checklists -> add a checklist to a specific ticket. Handled by the checklist controller since checklists are their own feature, but nested under a ticket's id.
ticketRouter.post('/:ticketId/checklists', checklistController.addToTicket);