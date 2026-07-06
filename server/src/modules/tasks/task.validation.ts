import { z } from "zod"
import { TASK_PRIORITIES , TASK_STATUSES } from "../../models/Task.js"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTaskSchema = z.object({
    title : z.string().min(1),
    description : z.string().optional(),
    status : z.enum(TASK_STATUSES).optional(),
    priority : z.enum(TASK_PRIORITIES).optional(),
    dueDate : z.string().datetime().optional(),
    projectId : objectId.optional()
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

