import { z } from "zod" // zod is a library for validating data shapes (like "does this object have a title that's a string?")
import { TASK_PRIORITIES , TASK_STATUSES } from "../../models/Task.js" // pull in the allowed status/priority values from the Task model, so validation and the DB always agree on what's valid

// a little reusable rule: MongoDB ids are 24-character hex strings, so we check the incoming id string looks like that shape
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// this schema describes what a valid "create a new task" request body must look like
export const createTaskSchema = z.object({
    title : z.string().min(1), // title is required and must not be an empty string
    description : z.string().optional(), // description is optional free text
    status : z.enum(TASK_STATUSES).optional(), // if provided, status must be one of the fixed allowed values (e.g. "todo", "done", etc.)
    priority : z.enum(TASK_PRIORITIES).optional(), // if provided, priority must be one of the fixed allowed values (e.g. "low", "high")
    dueDate : z.string().datetime().optional(), // if provided, must be a valid ISO date-time string
    projectId : objectId.optional(), // optional link to the Project this task belongs to (this is how Tasks relate to Projects)
    assigneeId : objectId.optional() // NEW — optional id of the user this task is being handed to
});

// for updates we don't want to force the caller to resend every field, so `.partial()` makes every field from createTaskSchema optional.
// `.extend()` then re-declares assigneeId so it can ALSO be explicitly `null` (to unassign a task back to "nobody"),
// which the base `objectId.optional()` above wouldn't allow — that only accepts "a valid id" or "field missing", not "null".
// This is the exact same trick used in ticket.validation.ts's updateTicketSchema, for the exact same reason.
export const updateTaskSchema = createTaskSchema.partial().extend({
    assigneeId : objectId.nullable().optional()
});

// these are TypeScript types automatically derived from the zod schemas above, so the rest of the code
// (service/controller) can use strongly-typed "CreateTaskInput" / "UpdateTaskInput" without redefining them by hand
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
