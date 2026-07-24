import { z } from "zod" 
import { TASK_PRIORITIES , TASK_STATUSES } from "../../models/Task.js" // pull in the allowed status/priority values from the Task model, so validation and the DB always agree on what's valid

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTaskSchema = z.object({
    title : z.string().min(1), // title is required and must not be an empty string
    description : z.string().optional(), // description is optional free text
    status : z.enum(TASK_STATUSES).optional(), // if provided, status must be one of the fixed allowed values (e.g. "todo", "done", etc.)
    priority : z.enum(TASK_PRIORITIES).optional(), // if provided, priority must be one of the fixed allowed values (e.g. "low", "high")
    dueDate : z.string().datetime().optional(), // if provided, must be a valid ISO date-time string
    projectId : objectId.optional(), // optional link to the Project this task belongs to (this is how Tasks relate to Projects)
    assigneeId : objectId.optional(), // NEW — optional id of the user this task is being handed to
    departmentId : objectId.optional() // NEW — optional id of the department this task is tagged to, same idea as Ticket's departmentId
});


export const complianceReportQuerySchema = z.object({
    groupBy : z.enum(["hour", "day", "week", "month"]).default("day"),
    departmentId : objectId.optional(),
    from : z.string().optional(),
    to : z.string().optional()


})

export const updateTaskSchema = createTaskSchema.partial().extend({
    assigneeId : objectId.nullable().optional(),
    departmentId : objectId.nullable().optional() // NEW — allow clearing it back to "no department" via null
});

// PC/Admin verification action on a task that's pending_verification: APPROVE marks it truly
// done, REJECT bounces it back to in_progress. A note is required when rejecting so the
// assignee knows what to fix; optional when approving.
export const verifyTaskSchema = z.object({
    action : z.enum(["APPROVE", "REJECT"]),
    note : z.string().optional(),
}).refine(v => v.action === "APPROVE" || !!v.note?.trim(), {
    message : "A note is required when rejecting.",
    path : ["note"],
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ComplianceReportQuery = z.infer<typeof complianceReportQuerySchema>;
export type VerifyTaskInput = z.infer<typeof verifyTaskSchema>;
