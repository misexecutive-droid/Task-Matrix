// Mongoose models - each one maps to a MongoDB collection.
// Ticket -> Checklist -> ChecklistItem is a parent -> child -> grandchild relationship:
// a Ticket can have many Checklists, and each Checklist can have many ChecklistItems.
import { Checklist } from '../../models/Checklist.js';
import { ChecklistItem } from '../../models/ChecklistItem.js';
import { ChecklistImage } from '../../models/ChecklistImage.js';
import { ChecklistTemplate } from '../../models/ChecklistTemplate.js';
import { ChecklistTemplateItem } from '../../models/ChecklistTemplateItem.js';
import { Ticket } from '../../models/Ticket.js';
// A helper for throwing consistent, HTTP-status-aware errors (e.g. 404 "not found").
import { AppError } from '../../utils/AppError.js';
// Sends a real-time event (e.g. over websockets) so connected clients update live.
import { emitTicketEvent } from '../../sockets/ticketEvent.js';
// Types describing the shape of validated input for creating a checklist / updating an item.
import type { CreateChecklistInput, UpdateChecklistItemInput } from './checklist.validation.js';
import type { AccessTokenPayload } from '../../middleware/auth/auth.js';

const populateChecklist = (query: any) =>
  query.populate({ path: 'items', populate: { path: 'images' } });

// Who's allowed to change a checklist's STRUCTURE — create/edit/delete checklists and items,
// change photo requirements, reassign items: the ticket's raiser, or an admin. Same split as
// the Task side (taskChecklist.service.ts) — managing the work isn't the same as doing it.
const assertCanManage = (user: AccessTokenPayload, ticket: any) => {
  if (user.role === 'ADMIN') return;
  if (String(ticket.userId) === user.sub) return;
  throw AppError.forbidden('Only the ticket owner can manage its checklists');
};

// Who's allowed to mark a specific item complete, or upload photos toward it — the item's
// assignee, or an admin.
const assertCanComplete = (user: AccessTokenPayload, item: any) => {
  if (user.role === 'ADMIN') return;
  if (item.assigneeId && String(item.assigneeId) === user.sub) return;
  throw AppError.forbidden('Only the assigned person can complete this item');
};

// All the checklist-related database logic lives here, separate from the HTTP layer (controller).
export const checklistService = {
  // Creates a new Checklist under a given Ticket, and (optionally) its initial items in one step.
  async addToTicket(ticketId: string, input: CreateChecklistInput) {
    // Create the checklist itself first, linking it to its parent ticket via ticketId.
    const checklist = await Checklist.create({ title: input.title, ticketId });
    // If the caller supplied any items along with the checklist, create them all now,
    // each one pointing back at the checklist we just made via checklistId.
    if (input.items?.length) {
      // insertMany is more efficient than looping and calling .create() one item at a time.
      await ChecklistItem.insertMany(input.items.map(i => ({ ...i, checklistId: checklist._id })));
    }
    // Re-fetch the checklist and "populate" its items (and each item's images) so the response
    // includes everything the frontend needs, not just the checklist's own fields.
    return populateChecklist(Checklist.findById(checklist._id));
  },

  // Stamp out a real checklist under this ticket from a reusable, admin-authored template —
  // same result as addToTicket, just sourced from ChecklistTemplate/ChecklistTemplateItem
  // instead of hand-typed input (see taskChecklistService.createFromTemplate for the Task-side
  // equivalent). assigneeId is seeded from the template item's defaultAssigneeId when set.
  async addFromTemplateToTicket(ticketId: string, templateId: string) {
    const template = await ChecklistTemplate.findById(templateId);
    if (!template) throw AppError.notFound('Checklist template not found');
    if (template.appliesTo !== 'TICKET') throw AppError.badRequest('This template applies to tasks, not tickets');

    const templateItems = await ChecklistTemplateItem.find({ templateId }).sort({ order: 1 });

    const checklist = await Checklist.create({ title: template.name, ticketId });
    if (templateItems.length) {
      await ChecklistItem.insertMany(
        templateItems.map((item) => ({
          label: item.label,
          requiredImageCount: item.requiredImageCount,
          maxImageCount: item.maxImageCount,
          requiresLivePhoto: item.requiresLivePhoto,
          assigneeId: item.defaultAssigneeId,
          checklistId: checklist._id,
        })),
      );
    }

    return populateChecklist(Checklist.findById(checklist._id));
  },

  // Deletes an entire checklist, along with all of its items (the children go away with the parent).
  async removeChecklist(id: string) {
    // findByIdAndDelete both looks up and removes the checklist in one database call.
    const checklist = await Checklist.findByIdAndDelete(id);
    // If nothing was found/deleted, there was no checklist with that id - report a 404-style error.
    if (!checklist) throw AppError.notFound('Checklist not found');
    // Clean up every item (and their images) that belonged to this checklist so we don't leave
    // orphaned records behind.
    const items = await ChecklistItem.find({ checklistId: id });
    await ChecklistImage.deleteMany({ checklistItemId: { $in: items.map(i => i._id) } });
    await ChecklistItem.deleteMany({ checklistId: id });
    return checklist;
  },

  // Updates one checklist item (e.g. label, isDone, assigneeId, dueAt - see validation schema).
  async updateItem(id: string, input: UpdateChecklistItemInput, user: AccessTokenPayload) {
    const item = await ChecklistItem.findById(id);
    // Can't update something that doesn't exist.
    if (!item) throw AppError.notFound('Checklist item not found');

    const checklist = await Checklist.findById(item.checklistId);
    const ticket = checklist ? await Ticket.findById(checklist.ticketId) : null;
    if (!ticket) throw AppError.notFound('Ticket not found');
    assertCanManage(user, ticket);

    // Copy every field from the validated input onto the existing item (only overwrites fields that were sent).
    Object.assign(item, input);
    // Persist the change to the database.
    await item.save();

    // Notify whoever is watching this ticket that one of its checklist items changed.
    emitTicketEvent('checklistItem:updated', {
      // These ids tell the real-time layer which connected users/rooms should receive the update
      // (the ticket's owner, assignee, department, and store).
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    }, item);

    return item;
  },

  // THE key method: the one place that decides "yes, this checklist item is genuinely done."
  // Same reasoning as taskChecklist.service.ts's completeItem — checks actual uploaded
  // ChecklistImage records against the item's own requirements, never trusts the client.
  async completeItem(itemId: string, user: AccessTokenPayload) {
    const item = await ChecklistItem.findById(itemId);
    if (!item) throw AppError.notFound('Checklist item not found');
    assertCanComplete(user, item);

    const images = await ChecklistImage.find({ checklistItemId: item._id });

    const qualifyingImages = item.requiresLivePhoto
      ? images.filter((img) => img.captureMethod === 'LIVE')
      : images;

    if (qualifyingImages.length < item.requiredImageCount) {
      const missing = item.requiredImageCount - qualifyingImages.length;
      const kind = item.requiresLivePhoto ? 'live photo(s)' : 'photo(s)';
      throw AppError.badRequest(`Upload ${missing} more ${kind} before this item can be marked complete`);
    }

    item.isDone = true; // triggers the model's pre('save') hook, which stamps completedAt automatically
    await item.save();
    return item;
  },

  // Set the item's remarks — free text the assignee writes about their own work on this item.
  // Uses assertCanComplete (assignee-or-admin), not assertCanManage, same reasoning as the
  // Task side: this is the person doing the work describing what they did.
  async updateRemarks(itemId: string, remarks: string, user: AccessTokenPayload) {
    const item = await ChecklistItem.findById(itemId);
    if (!item) throw AppError.notFound('Checklist item not found');
    assertCanComplete(user, item);

    item.remarks = remarks;
    await item.save();
    return item;
  },

  // Deletes a single checklist item without touching the checklist it belongs to.
  async removeItem(id: string) {
    const item = await ChecklistItem.findByIdAndDelete(id);
    if (!item) throw AppError.notFound('Checklist item not found');
    await ChecklistImage.deleteMany({ checklistItemId: item._id });
    return item;
  },
};