import type { Request , Response } from "express"
import { taskService } from "./task.service.js"
import { createTaskSchema , updateTaskSchema } from "./task.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const taskController = {
    list : asyncHandler(async ( req : Request , res : Response) => {
        const tasks = await taskService.list(req.user!)
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

    remove : asyncHandler(async (req : Request , res : Response) => {
        await taskService.remove(req.params.id , req.user!)
        res.json({ success : true})
    })
}