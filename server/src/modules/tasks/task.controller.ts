import type { Request , Response } from "express" 
import { taskService } from "./task.service.js" 
import { createTaskSchema , updateTaskSchema, verifyTaskSchema, complianceReportQuerySchema } from "./task.validation.js" 
import { asyncHandler } from "../../utils/asyncHandler.js" 

export const taskController = {
    list : asyncHandler(async ( req : Request , res : Response) => {
        const filterUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const tasks = await taskService.list(req.user!, filterUserId, status) 
        res.json(tasks) 
    }),

    getOne : asyncHandler(async (req : Request , res : Response) => {
        const task = await taskService.getById(req.params.id , req.user!);
        res.json(task)
    }),

    create : asyncHandler(async (req : Request , res : Response) => {
        const input = createTaskSchema.parse(req.body); 
        const task = await taskService.create(input , req.user!)
        res.status(201).json(task)
    }),

    update : asyncHandler(async (req : Request , res : Response) => {
        const input = updateTaskSchema.parse(req.body); 
        const task = await taskService.update(req.params.id , input , req.user!)
        res.json(task);
    }),

    verify : asyncHandler(async (req : Request , res : Response) => {
        const input = verifyTaskSchema.parse(req.body);
        const task = await taskService.verify(req.params.id , input , req.user!)
        res.json(task);
    }),

    remove : asyncHandler(async (req : Request , res : Response) => {
        await taskService.remove(req.params.id , req.user!)
        res.json({ success : true}) 
    }),

    complianceReport : asyncHandler(async (req : Request , res : Response) => {
        const query = complianceReportQuerySchema.parse(req.query);
        const isPrivileged = req.user!.role === "ADMIN" || req.user!.role === "PC";
        const departmentId = isPrivileged ? query.departmentId : undefined;
        const userId = isPrivileged ? undefined : req.user!.sub;
        const data = await taskService.complianceReport(query.groupBy, departmentId, query.from, query.to, userId);
        res.json({ success : true, data })
    }),
}
