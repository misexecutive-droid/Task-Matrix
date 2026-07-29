import { Event } from "../../models/Event.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateEventInput, UpdateEventInput } from "./event.validation.js";

export const eventService = {
    async list() {
        return Event.find().sort({ eventDate: 1 }).populate("createdBy", "firstName lastName")
    },

    async listUpcoming(limit: number) {
        return Event.find({ eventDate: { $gte: new Date() } })
            .sort({ eventDate: 1 })
            .limit(limit)
            .populate("createdBy", "firstName lastName")
    },

    async getById(id: string) {
        const event = await Event.findById(id).populate("createdBy", "firstName lastName")
        if (!event) throw AppError.notFound("Event not found")
        return event
    },

    async create(input: CreateEventInput, createdBy: string) {
        return Event.create({ ...input, createdBy })
    },

    async update(id: string, input: UpdateEventInput) {
        const event = await Event.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!event) throw AppError.notFound("Event not found")
        return event
    },

    async remove(id: string) {
        const event = await Event.findByIdAndDelete(id)
        if (!event) throw AppError.notFound("Event not found")
        return event
    }
}
