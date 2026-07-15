// TypeScript types for Express's request/response objects, used only for type-checking.
import type { Request, Response } from 'express';
// The service layer does the real database work; the controller just wires HTTP <-> service.
import { checklistService } from './checklist.service.js';
// Zod schemas that validate/shape incoming request bodies before we trust them.
import { createChecklistSchema, updateChecklistItemSchema, updateRemarksSchema } from './checklist.validation.js';
// A wrapper that catches errors thrown inside async route handlers and forwards them to
// Express's error-handling middleware, so we don't need try/catch in every handler below.
import { asyncHandler } from '../../utils/asyncHandler.js';

// All the HTTP handlers for checklists and their items live in this one object.
export const checklistController = {
  // Handles: POST /tickets/:ticketId/checklists (see ticket.routes.ts) - creates a new
  // Checklist nested under a specific Ticket, optionally with its ChecklistItems in one go.
  addToTicket: asyncHandler(async (req: Request, res: Response) => {
    // Validate/parse the request body against the schema; throws if it doesn't match (title required, etc).
    const input = createChecklistSchema.parse(req.body);
    // req.params.ticketId comes from the :ticketId part of the nested route URL - this is
    // what links the new Checklist to its parent Ticket.
    const checklist = await checklistService.addToTicket(req.params.ticketId, input);
    // 201 = "Created". Send back the new checklist (with its items) wrapped in a standard shape.
    res.status(201).json({ success: true, data: checklist });
  }),

  // Handles: POST /tickets/:ticketId/checklists/from-template/:templateId — create a checklist
  // under a ticket by copying an admin-authored ChecklistTemplate's items.
  addFromTemplateToTicket: asyncHandler(async (req: Request, res: Response) => {
    const checklist = await checklistService.addFromTemplateToTicket(req.params.ticketId, req.params.templateId);
    res.status(201).json({ success: true, data: checklist });
  }),

  // Handles: DELETE /checklists/:id - deletes a whole checklist (and cascades to its items,
  // see checklist.service.ts removeChecklist).
  removeChecklist: asyncHandler(async (req: Request, res: Response) => {
    await checklistService.removeChecklist(req.params.id);
    // No data to return for a delete, so we just confirm it happened.
    res.json({ success: true, data: { deleted: true } });
  }),

  // Handles: PATCH /checklist-items/:id - updates one item inside a checklist
  // (e.g. toggling isDone, changing label/assignee/dueAt, photo requirements).
  updateItem: asyncHandler(async (req: Request, res: Response) => {
    // Only fields allowed by updateChecklistItemSchema get through (all optional, see validation file).
    const input = updateChecklistItemSchema.parse(req.body);
    const item = await checklistService.updateItem(req.params.id, input, req.user!);
    res.json({ success: true, data: item });
  }),

  // Handles: POST /checklist-items/:id/complete — the ONLY way to mark an item done. No body
  // needed: the server checks the item's own uploaded images against its own requirements.
  completeItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await checklistService.completeItem(req.params.id, req.user!);
    res.json({ success: true, data: item });
  }),

  // Handles: PATCH /checklist-items/:id/remarks — the assignee's own notes about their work.
  updateRemarks: asyncHandler(async (req: Request, res: Response) => {
    const { remarks } = updateRemarksSchema.parse(req.body);
    const item = await checklistService.updateRemarks(req.params.id, remarks, req.user!);
    res.json({ success: true, data: item });
  }),

  // Handles: DELETE /checklist-items/:id - deletes a single item, leaving the rest of the checklist alone.
  removeItem: asyncHandler(async (req: Request, res: Response) => {
    await checklistService.removeItem(req.params.id);
    res.json({ success: true, data: { deleted: true } });
  }),
};