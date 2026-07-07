import { Checklist } from '../../models/Checklist.js';
import { ChecklistItem } from '../../models/ChecklistItem.js';
import { Ticket } from '../../models/Ticket.js';
import { AppError } from '../../utils/AppError.js';
import { emitTicketEvent } from '../../sockets/ticketEvent.js';
import type { CreateChecklistInput, UpdateChecklistItemInput } from './checklist.validation.js';

export const checklistService = {
  async addToTicket(ticketId: string, input: CreateChecklistInput) {
    const checklist = await Checklist.create({ title: input.title, ticketId });
    if (input.items?.length) {
      await ChecklistItem.insertMany(input.items.map(i => ({ label: i.label, checklistId: checklist._id })));
    }
    return Checklist.findById(checklist._id).populate('items');
  },

  async removeChecklist(id: string) {
    const checklist = await Checklist.findByIdAndDelete(id);
    if (!checklist) throw AppError.notFound('Checklist not found');
    await ChecklistItem.deleteMany({ checklistId: id });
    return checklist;
  },

  async updateItem(id: string, input: UpdateChecklistItemInput) {
    const item = await ChecklistItem.findById(id);
    if (!item) throw AppError.notFound('Checklist item not found');
    Object.assign(item, input);
    await item.save();

    const checklist = await Checklist.findById(item.checklistId);
    const ticket = checklist ? await Ticket.findById(checklist.ticketId) : null;
    if (ticket) {
      emitTicketEvent('checklistItem:updated', {
        userId:       ticket.userId?.toString(),
        assigneeId:   ticket.assigneeId?.toString() ?? null,
        departmentId: ticket.departmentId?.toString() ?? null,
        storeId:      ticket.storeId?.toString() ?? null,
      }, item);
    }

    return item;
  },

  async removeItem(id: string) {
    const item = await ChecklistItem.findByIdAndDelete(id);
    if (!item) throw AppError.notFound('Checklist item not found');
    return item;
  },
};
