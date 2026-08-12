import { z } from "zod"
import { TASK_PRIORITIES , TASK_STATUSES } from "../../models/Task.js" ;
import { objectId } from "../../utils/index.js"

export const createTaskSchema = z.object({
    title : z.string().min(1), 
    description : z.string().optional(),
    status : z.enum(TASK_STATUSES).optional(), 
    priority : z.enum(TASK_PRIORITIES).optional(), 
    dueDate : z.string().datetime().optional(), 
    projectId : objectId.optional(),
    assigneeId : objectId.optional(), 
    departmentId : objectId.optional() 
});


export const confirmSmartTaskSchema = z.object({
    title : z.string().min(1),
    context : z.string().optional(),
    category : z.enum(["issue", "delegated_task"]),
    priority : z.enum(TASK_PRIORITIES),
    dueDate : z.string().datetime(),
    assigneeId : objectId.optional(),
    departmentId : objectId.optional(),
    assigneeRaw : z.string().optional(),
    departmentRaw : z.string().optional(),
    confidence : z.number().optional(),
    rawInput : z.string(),
    inputMode : z.enum(["voice", "text"]),
    wonBy : z.string().optional(),
    channel : z.enum(["whatsapp" , "web"])
})

export const listTasksQuerySchema = z.object({
    userId : objectId.optional(),
    status : z.enum(TASK_STATUSES).optional(),
    page : z.coerce.number().int().min(1).optional().default(1),
    // Capped at 200 (also the default) — high enough that today's usage never notices it, but
    // still a real ceiling so GET /tasks can't be made to return an unbounded result set.
    limit : z.coerce.number().int().min(1).max(200).optional().default(200),
})

export const complianceReportQuerySchema = z.object({
    groupBy : z.enum(["hour", "day", "week", "month", "year"]).default("day"),
    departmentId : objectId.optional(),
    from : z.string().optional(),
    to : z.string().optional()
})

export const updateTaskSchema = createTaskSchema.partial().extend({
    assigneeId : objectId.nullable().optional(),
    departmentId : objectId.nullable().optional() 
});


export const verifyTaskSchema = z.object({
    action : z.enum(["APPROVE", "REJECT"]),
    note : z.string().optional(),
}).refine(v => v.action === "APPROVE" || !!v.note?.trim(), {
    message : "A note is required when rejecting.",
    path : ["note"],
})

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ComplianceReportQuery = z.infer<typeof complianceReportQuerySchema>;
export type VerifyTaskInput = z.infer<typeof verifyTaskSchema>;
export type ConfirmSmartTaskInput = z.infer<typeof confirmSmartTaskSchema>;
