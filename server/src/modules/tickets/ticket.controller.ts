import { type Request , type Response } from "express"
import { ticketService } from "./ticket.service.js"
import { createTicketSchema , paginatioinSchema, updateTicketSchema , tatReportQuerySchema } from "./ticket.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const ticketController = {
    list : asyncHandler( async ( req : Request , res : Response) => {
        const { page , limit } = paginatioinSchema.parse(req.query);
        const result = await ticketService.list(req.user!, page , limit)
        res.json({ success : true , ...result})
    }),

    // Handles GET /tickets/:id - fetch one ticket by its id.
    getOne : asyncHandler(async (req : Request , res : Response) => {
        // req.params.id comes from the ":id" part of the route path. The service checks both that the ticket exists AND that this user is allowed to view it.
        const ticket = await ticketService.getById(req.params.id , req.user!);
        res.json({ success : true , data : ticket})
    }),

    // Handles POST /tickets - create a brand new ticket.
    create : asyncHandler( async (req : Request , res : Response) => {
        // Validate the request body against createTicketSchema (title, description, priority, etc). Any missing required field or wrong type causes Zod to throw, which becomes a 400 Bad Request automatically (see error-handling middleware) - we don't have to write manual "if (!title) return res.status(400)..." checks.
        const input = createTicketSchema.parse(req.body);
        // Hand the validated input off to the service, which actually creates the ticket in the database, records an audit log, fires a real-time socket event, and sends a notification if someone was assigned.
        const ticket = await ticketService.create(input , req.user!)
        // 201 = "Created" - the standard HTTP status code for a successful POST that made a new resource.
        res.status(201).json({ success : true , data : ticket})
    }),

    // Handles PATCH /tickets/:id - partially update an existing ticket.
    update : asyncHandler ( async (req : Request , res : Response) => {
        // updateTicketSchema is like createTicketSchema but with every field optional (since PATCH only sends the fields being changed), plus it allows updating `status` and `assigneeId`.
        const input = updateTicketSchema.parse(req.body);
        // The service checks whether this user is even allowed to modify this particular ticket (see assertCanMutate) before applying changes.
        const ticket = await ticketService.update(req.params.id , input , req.user!)
        res.json({ success : true , data : ticket})
    }),

    // Handles DELETE /tickets/:id - only reachable by ADMIN users (enforced by requireRole('ADMIN') in the router, before this even runs).
    remove : asyncHandler ( async ( req : Request, res : Response) => {
        await ticketService.remove(req.params.id , req.user!)
        // There's no ticket data to return since it's deleted, so we just confirm with { deleted: true }.
        res.json({ success : true , data : { deleted : true}})
    }),

    tatReport : asyncHandler(async (req : Request , res : Response) => {
        const { groupBy, from , to} = tatReportQuerySchema.parse(req.query);
        const data = await ticketService.tatReport(groupBy, from, to);
        res.json({ success : true, data})
    })
}