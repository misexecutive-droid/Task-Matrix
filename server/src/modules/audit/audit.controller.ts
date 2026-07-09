import type { Request , Response } from "express" // Express types for the incoming request and outgoing response objects
import { auditService } from "./audit.service.js" // the service layer that actually talks to the database for audit logs
import { auditQuerySchema } from "./audit.validation.js" // the zod schema we use to validate/parse query params
import { asyncHandler } from "../../utils/asyncHandler.js" // wraps async route handlers so thrown errors are passed to Express's error handling instead of crashing the server

// The audit controller exposes the HTTP-facing functions for reading audit history.
// Audit logs are a compliance/history trail: every time something important changes (a ticket, a user, etc.)
// we record a "before" and "after" snapshot plus who did it (actorId). This lets admins answer
// "who changed this record, and what did it look like before?" - useful for accountability and debugging.
export const auditController = {
    // GET handler that returns all audit log entries for one specific entity (e.g. one Ticket's full history)
    listForEntity : asyncHandler(async (req : Request , res : Response) => {
        // pull entityType/entityId out of the query string (e.g. ?entityType=Ticket&entityId=...) and validate them
        const { entityType , entityId } = auditQuerySchema.parse(req.query);
        // ask the service layer for every audit log recorded against this entity
        const logs = await auditService.listForEntity(entityType , entityId)
        // send them back to the client as JSON
        res.json({ success : true , data : logs})
    })
}