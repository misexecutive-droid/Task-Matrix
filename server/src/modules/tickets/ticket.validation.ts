import { z } from "zod"
import { PRIORITIES, ASSIGNMENT_MODES, TICKET_STATUSES } from "../../models/Ticket.js"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTicketSchema = z.object({
    title : z.string().min(1),
    description : z.string().min(1),
    priority :  z.enum(PRIORITIES).optional(),
    assignmentMode : z.enum(ASSIGNMENT_MODES).optional(),
    assigneeId : objectId.optional(),
    storeId : objectId.optional(),
    categoryId : objectId.optional(),
    departmentId : objectId.optional(),
    tatHours : z.number().positive().optional()
})
export const updateTicketSchema = createTicketSchema.partial().extend({
    status : z.enum(TICKET_STATUSES).optional(),
    assigneeId : objectId.nullable().optional()
})

export const paginatioinSchema = z.object({
    page : z.coerce.number().int().min(1).default(1),
    limit : z.coerce.number().int().min(1).max(100).default(20),
    status : z.enum(TICKET_STATUSES).optional(),
})

export const tatReportQuerySchema = z.object({
    groupBy : z.enum(["hour", "day", "week", "month"]).default("day"),
    from : z.string().optional(),
    to : z.string().optional(),
})

// PC/Admin verification action on a ticket that's IN_REVIEW: APPROVE closes it for good,
// REJECT bounces it back to IN_PROGRESS. A note is required when rejecting so the assignee
// knows what to fix; optional when approving.
export const verifyTicketSchema = z.object({
    action : z.enum(["APPROVE", "REJECT"]),
    note : z.string().optional(),
}).refine(v => v.action === "APPROVE" || !!v.note?.trim(), {
    message : "A note is required when rejecting.",
    path : ["note"],
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TatReportQuery = z.infer<typeof tatReportQuerySchema>;
export type VerifyTicketInput = z.infer<typeof verifyTicketSchema>;
