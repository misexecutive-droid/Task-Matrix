import { z } from "zod"
import { EVENT_TYPES } from "../../models/Event.js"

export const createEventSchema = z.object({
    title : z.string().min(1),
    description : z.string().optional(),
    type : z.enum(EVENT_TYPES).optional(),
    eventDate : z.string().min(1),
})

export const updateEventSchema = createEventSchema.partial()

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
