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
    assigneeId : objectId.optional() // NEW — optional id of the user this task is being handed to
});


export const complianceReportQuerySchema = z.object({
    groupBy : z.enum(["hour", "day", "week", "month"]).default("day"),
    departmentId : objectId.optional(),
    from : z.string().optional(),
    to : z.string().optional()


})

export const updateTaskSchema = createTaskSchema.partial().extend({
    assigneeId : objectId.nullable().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ComplianceReportQuery = z.infer<typeof complianceReportQuerySchema>;
