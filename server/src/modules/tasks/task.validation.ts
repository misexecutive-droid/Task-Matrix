import { z } from "zod"
import { TASK_PRIORITIES , TASK_STATUSES, TASK_REMINDER_CHANNELS } from "../../models/Task.js" ;
import { objectId } from "../../utils/index.js"

export const createTaskSchema = z.object({
    title : z.string().min(1),
    description : z.string().optional(),
    status : z.enum(TASK_STATUSES).optional(),
    priority : z.enum(TASK_PRIORITIES).optional(),
    startDate : z.string().datetime().optional(),
    dueDate : z.string().datetime().optional(),
    reminderMinutesBefore : z.number().int().positive().optional(),
    reminderChannel : z.enum(TASK_REMINDER_CHANNELS).optional(),
    projectId : objectId.optional(),
    assigneeId : objectId.optional(),
    additionalAssigneeIds : z.array(objectId).optional(),
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

export const parseTaskTextSchema = z.object({
    // Smart Add's free-form input (typed or transcribed) — capped well above any real message so
    // a malicious caller can't force extractTaskFromText to send a huge payload to the AI provider.
    text : z.string().min(1, "text is required").max(4000),
})

export const complianceReportQuerySchema = z.object({
    groupBy : z.enum(["hour", "day", "week", "month", "year"]).default("day"),
    departmentId : objectId.optional(),
    // Lets an ADMIN/PC drill into one specific person's checklist completion (e.g. the Team
    // Overview page) — ignored for a non-privileged caller, who's always scoped to themselves
    // regardless of what's passed here (see task.controller.ts).
    userId : objectId.optional(),
    from : z.string().optional(),
    to : z.string().optional()
})

export const updateTaskSchema = createTaskSchema.partial().extend({
    assigneeId : objectId.nullable().optional(),
    departmentId : objectId.nullable().optional(),
    reminderMinutesBefore : z.number().int().positive().nullable().optional(),
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
export type ParseTaskTextInput = z.infer<typeof parseTaskTextSchema>;
