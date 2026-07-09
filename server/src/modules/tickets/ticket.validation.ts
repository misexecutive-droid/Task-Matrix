// zod is a library for describing the "shape" data should have, and validating/parsing real data against that shape at runtime (unlike TypeScript types, which only exist at compile time and vanish once the code runs).
import { z } from "zod"
// Import the allowed enum values (arrays of valid strings) straight from the Mongoose model file, so the validation schema and the database schema always agree on what values are legal.
import { PRIORITIES, ASSIGNMENT_MODES, TICKET_STATUSES } from "../../models/Ticket.js"

// A reusable schema piece: a string that must look like a valid MongoDB ObjectId (24 hex characters). Used anywhere we expect an id referencing another document (assignee, store, category, department).
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Schema for the body of POST /tickets (creating a new ticket). If `.parse()` is called on data that doesn't match this shape, Zod throws an error, which the controller lets bubble up to the global error-handling middleware, which turns it into an HTTP 400 Bad Request automatically - so this schema IS the input validation, we don't write manual if-checks.
export const createTicketSchema = z.object({
    // Required, must be a non-empty string.
    title : z.string().min(1),
    // Required, must be a non-empty string.
    description : z.string().min(1),
    // Optional - if provided, must be one of the allowed PRIORITIES values (e.g. "LOW"/"MEDIUM"/"HIGH").
    priority :  z.enum(PRIORITIES).optional(),
    // Optional - must be one of the allowed ASSIGNMENT_MODES if provided.
    assignmentMode : z.enum(ASSIGNMENT_MODES).optional(),
    // Optional - id of the user this ticket is assigned to.
    assigneeId : objectId.optional(),
    // Optional - id of the store this ticket relates to.
    storeId : objectId.optional(),
    // Optional - id of the category this ticket falls under.
    categoryId : objectId.optional(),
    // Optional - id of the department this ticket belongs to.
    departmentId : objectId.optional(),
    // Optional - "Turnaround Time" in hours, must be a positive number if given (e.g. this ticket should be resolved within X hours).
    tatHours : z.number().positive().optional()
})

// Schema for PATCH /tickets/:id (updating an existing ticket).
// `.partial()` takes every field from createTicketSchema and makes it optional (since a PATCH might only send one changed field, not the whole object).
// `.extend()` then adds a couple of extra fields that only make sense on update, not create.
export const updateTicketSchema = createTicketSchema.partial().extend({
    // A ticket's workflow status (e.g. "OPEN"/"IN_PROGRESS"/"CLOSED") can only be changed via update, never set at creation.
    status : z.enum(TICKET_STATUSES).optional(),
    // Re-declare assigneeId here so it can also be explicitly set to `null` (to UN-assign a ticket), which the base `objectId.optional()` from createTicketSchema wouldn't allow (that only allows "a valid id" or "missing", not "null").
    assigneeId : objectId.nullable().optional()
})

// Schema for query string params on GET /tickets (?page=&limit=).
export const paginatioinSchema = z.object({
    // z.coerce.number() converts the incoming string (query params are always strings) into a number first, then validates it's a whole number >= 1. Defaults to page 1 if not provided.
    page : z.coerce.number().int().min(1).default(1),
    // Same idea, but capped at 100 so nobody can request an absurdly huge page size. Defaults to 20.
    limit : z.coerce.number().int().min(1).max(100).default(20),
})

// TypeScript types derived automatically from the Zod schemas above (so the type and the runtime validation can never drift out of sync). `z.infer<typeof X>` reads "the TS type that matches whatever schema X validates".
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;