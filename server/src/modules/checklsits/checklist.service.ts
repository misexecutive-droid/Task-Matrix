import { Checklist } from "../../models/Checklist.js";
import { ChecklistItem } from "../../models/ChecklistItem.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateChecklistInput, UpdateChecklistItemInput } from "./checklist.validation.js";

export const checklist = {
    async addToTicket(ticketId: string, input: CreateChecklistInput) {
        const checklist = await Checklist.create({ title: input.title, ticketId })

        if (input.items?.length) {
            await ChecklistItem.insertMany(input.items.map(i => ({ label: i.label, checklistId: checklist._id })))
        }

        return Checklist.findById(checklist._id).populate("items");
    },

    async updateItem(id: string, input: UpdateChecklistItemInput) {
        const item = await ChecklistItem.findById(id);
        if (!item) throw AppError.notFound("Checklist item not found")
        Object.assign(item, input)
        await item.save()
        return item
    },

    async removeItem(id: string) {
        const item = await ChecklistItem.findByIdAndDelete(id);
        if (!item)
            throw AppError.notFound("Checklist item not found")
        return item;
    }
}