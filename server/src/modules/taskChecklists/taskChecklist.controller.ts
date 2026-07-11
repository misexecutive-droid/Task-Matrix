import type { Request, Response } from "express";
import { taskChecklistService } from "./taskChecklist.service.js";
import { createTaskChecklistSchema } from "./taskChecklist.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { updateChecklistItemSchema } from "../checklists/checklist.validation.js";
import { success } from "zod/v4";

export const taskChecklistController = {
    // POST /tasks/:taskId/checklists -- create a checklist (optionally with items) under a task

    createForTask: asyncHandler(async (req: Request, res: Response) => {
        const input = createTaskChecklistSchema.parse(req.body);
        const checklist = await taskChecklistService.createForTask(req.params.taskId, input, req.user!)
        res.status(201).json({ success: true, data: checklist })
    }),

    // PATCH /task-checklist-items/:id -- edit and item's metadata (label, assignee , due date)
    // photo requirements , or reopen it with { isDone : false}

    updateItem: asyncHandler(async (req: Request, res: Response) => {
        const input = updateChecklistItemSchema.parse(req.body)
        const item = await taskChecklistService.updateItem(req.params.id, input, req.user!)
        res.json({ success: true, data: item })
    }),


    // POST /task-checklist-items/:id/complete — the ONLY way to mark an item done. No body
    // needed: the server checks the item's own uploaded images against its own requirements.

    completeItem: asyncHandler(async (req: Request, res: Response) => {
        const item = await taskChecklistService.completeItem(req.params.id, req.user!)
        res.json({ success: true, data: item })
    }),

        // DELETE /task-checklists/:id — remove a whole checklist (and everything under it)

    removeChecklist : asyncHandler(async (req : Request , res : Response) => {
        await taskChecklistService.removeChecklist(req.params.id, req.user!)
        res.json({ success : true , data : { deleted : true}})
    })
}