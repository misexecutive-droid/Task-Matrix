// Import Express's types just for TypeScript typing of req/res (no runtime import, just types).
import { type Request , type Response } from "express"
// The service layer holds all the actual business logic (talking to the database, checking permissions, etc). The controller's job is just to wire HTTP requests to these service functions.
import { ticketService } from "./ticket.service.js"
// Zod schemas used to validate incoming data (query params and request bodies) before we trust it.
import { createTicketSchema , paginatioinSchema, updateTicketSchema } from "./ticket.validation.js"
// asyncHandler wraps an async route handler so that if it throws (or its promise rejects), the error is automatically passed to Express's error-handling middleware instead of crashing the server or requiring a manual try/catch in every handler.
import { asyncHandler } from "../../utils/asyncHandler.js"

// This object holds one function per route (list, getOne, create, update, remove). The router file (ticket.routes.ts) points each HTTP route at one of these.
export const ticketController = {
    // Handles GET /tickets - returns a paginated list of tickets the current user is allowed to see.
    list : asyncHandler( async ( req : Request , res : Response) => {
        // Validate/parse the ?page=&limit= query string params using Zod. If they're missing, Zod fills in defaults (page 1, limit 20); if they're invalid (e.g. negative), `.parse` throws a ZodError automatically, which asyncHandler forwards to the error middleware -> becomes a 400 response.
        const { page , limit } = paginatioinSchema.parse(req.query);
        // req.user is set by the `authenticate` middleware that ran earlier. The `!` tells TypeScript "trust me, this is definitely set" since we know authenticate already ran on this route.
        const result = await ticketService.list(req.user!, page , limit)
        // Send back a JSON response, spreading in whatever the service returned (likely { data, meta }) alongside a success flag.
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
}