// Mongoose models - each one maps to a MongoDB collection.
// Ticket -> Checklist -> ChecklistItem is a parent -> child -> grandchild relationship:
// a Ticket can have many Checklists, and each Checklist can have many ChecklistItems.
import { Checklist } from '../../models/Checklist.js';
import { ChecklistItem } from '../../models/ChecklistItem.js';
import { Ticket } from '../../models/Ticket.js';
// A helper for throwing consistent, HTTP-status-aware errors (e.g. 404 "not found").
import { AppError } from '../../utils/AppError.js';
// Sends a real-time event (e.g. over websockets) so connected clients update live.
import { emitTicketEvent } from '../../sockets/ticketEvent.js';
// Types describing the shape of validated input for creating a checklist / updating an item.
import type { CreateChecklistInput, UpdateChecklistItemInput } from './checklist.validation.js';

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
      await ChecklistItem.insertMany(input.items.map(i => ({ label: i.label, checklistId: checklist._id })));
    }
    // Re-fetch the checklist and "populate" its items so the response includes the full item list,
    // not just the checklist's own fields.
    return Checklist.findById(checklist._id).populate('items');
  },

  // Deletes an entire checklist, along with all of its items (the children go away with the parent).
  async removeChecklist(id: string) {
    // findByIdAndDelete both looks up and removes the checklist in one database call.
    const checklist = await Checklist.findByIdAndDelete(id);
    // If nothing was found/deleted, there was no checklist with that id - report a 404-style error.
    if (!checklist) throw AppError.notFound('Checklist not found');
    // Clean up every item that belonged to this checklist so we don't leave orphaned records behind.
    await ChecklistItem.deleteMany({ checklistId: id });
    return checklist;
  },

  // Updates one checklist item (e.g. label, isDone, assigneeId, dueAt - see validation schema).
  async updateItem(id: string, input: UpdateChecklistItemInput) {
    const item = await ChecklistItem.findById(id);
    // Can't update something that doesn't exist.
    if (!item) throw AppError.notFound('Checklist item not found');
    // Copy every field from the validated input onto the existing item (only overwrites fields that were sent).
    Object.assign(item, input);
    // Persist the change to the database.
    await item.save();

    // Walk back up the parent chain (item -> checklist -> ticket) so we can notify
    // whoever is watching this ticket that one of its checklist items changed.
    const checklist = await Checklist.findById(item.checklistId);
    const ticket = checklist ? await Ticket.findById(checklist.ticketId) : null;
    // Only emit the event if we actually found the ticket (checklist/ticket might have been deleted).
    if (ticket) {
      emitTicketEvent('checklistItem:updated', {
        // These ids tell the real-time layer which connected users/rooms should receive the update
        // (the ticket's owner, assignee, department, and store).
        userId:       ticket.userId?.toString(),
        assigneeId:   ticket.assigneeId?.toString() ?? null,
        departmentId: ticket.departmentId?.toString() ?? null,
        storeId:      ticket.storeId?.toString() ?? null,
      }, item);
    }

    return item;
  },

  // Deletes a single checklist item without touching the checklist it belongs to.
  async removeItem(id: string) {
    const item = await ChecklistItem.findByIdAndDelete(id);
    if (!item) throw AppError.notFound('Checklist item not found');
    return item;
  },
};
