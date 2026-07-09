// Zod is a schema library: we describe the shape we expect, and it both validates
// incoming data at runtime AND lets TypeScript infer static types from that shape.
import { z } from 'zod';

// Shape required to create a new Checklist (used by POST /tickets/:ticketId/checklists).
export const createChecklistSchema = z.object({
  // The checklist must have a non-empty title (min(1) means "at least 1 character").
  title: z.string().min(1),
  // items is optional - you can create a checklist with no items yet and add them later.
  // If provided, it must be an array of objects each having a non-empty "label" string.
  items: z.array(z.object({ label: z.string().min(1) })).optional(),
});

// Shape allowed when updating a single ChecklistItem (used by PATCH /checklist-items/:id).
// Every field here is optional, so callers can send just the one field they want to change
// (e.g. only { isDone: true } to check something off).
export const updateChecklistItemSchema = z.object({
  // New text for the item, if changing it. Must not be empty if provided.
  label:      z.string().min(1).optional(),
  // Whether the item is completed/checked off.
  isDone:     z.boolean().optional(),
  // Who the item is assigned to - must look like a valid MongoDB ObjectId
  // (24 hexadecimal characters), which is how Mongoose ids are formatted.
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  // Due date/time - must be a valid ISO 8601 datetime string (e.g. "2026-07-09T12:00:00Z").
  dueAt:      z.string().datetime().optional(),
});

// z.infer derives a plain TypeScript type from each schema, so the rest of the app
// (controller/service) gets compile-time type checking that matches these validation rules.
export type CreateChecklistInput     = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
