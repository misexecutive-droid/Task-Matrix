import { z } from "zod"; // zod is a schema validation library - lets us define what shape/type incoming data should have, and validate it at runtime

// Schema for validating query parameters when someone asks for audit logs of a specific entity (e.g. a Ticket or a User)
export const auditQuerySchema = z.object({
    entityType : z.string().min(1), // the type of entity being audited, e.g. "Ticket" or "User" - must be a non-empty string
    entityId : z.string().regex(/^[0-9a-fA-F]{24}$/ , "Invalid id") // the MongoDB ObjectId of that entity - must be a 24-character hex string, otherwise reject with "Invalid id"
})