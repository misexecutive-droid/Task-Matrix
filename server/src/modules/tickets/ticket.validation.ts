import { z } from "zod"
import { PRIORITIES, ASSIGNMENT_MODES, TICKET_STATUSES } from "../../models/Ticket.js"
import { RESTRICTED_STATUSES } from "../../models/TicketStatusUpdate.js"
import { objectId } from "../../utils/index.js"

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
    groupBy : z.enum(["hour", "day", "week", "month", "year"]).default("day"),
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

// The restricted status-update flow: a non-verifier (assignee/creator/manager) moving a ticket
// to In Progress, On Hold, or In Review (labelled "Completed" for a plain USER — see
// ticketStatusLabel.ts on the client) must always explain why via a remark. Photos are optional
// evidence, captured either live or picked from the gallery — captureMethod is a plain string
// here (not an enum) since it arrives as a multipart form field.
export const statusUpdateSchema = z.object({
    status : z.enum(RESTRICTED_STATUSES),
    remark : z.string().trim().min(1, "A remark is required"),
    captureMethod : z.enum(["LIVE", "GALLERY"]).optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TatReportQuery = z.infer<typeof tatReportQuerySchema>;
export type VerifyTicketInput = z.infer<typeof verifyTicketSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
