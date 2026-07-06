import { z } from "zod"
import { PRIORITIES, ASSIGNMENT_MODES, TICKET_STATUSES } from "../../models/Ticket.js"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTicketSchema = z.object({
    title : z.string().min(1),
    description : z.string().min(1),
    priority :  z.enum(PRIORITIES).optional(),
    assigmentMode : z.enum(ASSIGNMENT_MODES).optional(),
    assigneeId : objectId.optional(),
    storeId : objectId.optional(),
    categoryId : objectId.optional(),
    departmentId : objectId.optional(),
    tatHours : z.number().positive().optional()
})

export const updateTicketSchema = createTicketSchema.partial().extend({
    status : z.enum(TICKET_STATUSES).optional()
})

export const paginatioinSchema = z.object({
    page : z.coerce.number().int().min(1).default(1),
    limit : z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;