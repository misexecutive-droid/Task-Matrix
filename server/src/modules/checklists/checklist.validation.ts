// Zod is a schema library: we describe the shape we expect, and it both validates
// incoming data at runtime AND lets TypeScript infer static types from that shape.
import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// Shape required to create a new Checklist (used by POST /tickets/:ticketId/checklists).
// Items can now carry their own photo requirements from the moment they're created, same
// as the Task side (see taskChecklist.validation.ts).
export const createChecklistSchema = z.object({
  // The checklist must have a non-empty title (min(1) means "at least 1 character").
  title: z.string().min(1),
  // items is optional - you can create a checklist with no items yet and add them later.
  items: z.array(z.object({
    label: z.string().min(1),
    assigneeId: objectId.optional(),
    dueAt: z.string().datetime().optional(),
    requiredImageCount: z.number().int().min(0).optional(),
    maxImageCount: z.number().int().min(0).optional(),
    requiresLivePhoto: z.boolean().optional(),
    remarks: z.string().max(2000).optional(),
  })).optional(),
});

// Shape allowed when updating a single ChecklistItem's metadata (used by PATCH /checklist-items/:id).
// `isDone` only accepts the literal `false` — same reasoning as taskChecklist.validation.ts:
// marking an item done goes through the dedicated `completeItem` action instead, which is the
// only place that actually checks photo compliance before allowing isDone: true. Reopening an
// already-completed item (isDone: false) doesn't need those checks, so it's still allowed here.
export const updateChecklistItemSchema = z.object({
  label: z.string().min(1).optional(),
  assigneeId: objectId.nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  requiredImageCount: z.number().int().min(0).optional(),
  maxImageCount: z.number().int().min(0).nullable().optional(),
  requiresLivePhoto: z.boolean().optional(),
  isDone: z.literal(false).optional(),
});

// Updating just the remarks text on an item — the assignee's own notes about their work,
// separate from the structural fields above (see checklist.service.ts's updateRemarks).
export const updateRemarksSchema = z.object({
  remarks: z.string().max(2000),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type UpdateRemarksInput = z.infer<typeof updateRemarksSchema>;