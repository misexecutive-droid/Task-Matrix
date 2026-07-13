import type { Request, Response } from "express";
import { taskChecklistService } from "./taskChecklist.service.js";
import { createTaskChecklistSchema, updateTaskChecklistItemSchema, updateRemarksSchema } from "./taskChecklist.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
        const input = updateTaskChecklistItemSchema.parse(req.body)
        const item = await taskChecklistService.updateItem(req.params.id, input, req.user!)
        res.json({ success: true, data: item })
    }),


    // POST /task-checklist-items/:id/complete — the ONLY way to mark an item done. No body
    // needed: the server checks the item's own uploaded images against its own requirements.

    completeItem: asyncHandler(async (req: Request, res: Response) => {
        const item = await taskChecklistService.completeItem(req.params.id, req.user!)
        res.json({ success: true, data: item })
    }),

    // PATCH /task-checklist-items/:id/remarks — the assignee's own notes about their work on
    // this item. Separate from updateItem since it has its own (looser) permission rule.
    updateRemarks: asyncHandler(async (req: Request, res: Response) => {
        const { remarks } = updateRemarksSchema.parse(req.body);
        const item = await taskChecklistService.updateRemarks(req.params.id, remarks, req.user!);
        res.json({ success: true, data: item });
    }),

        // DELETE /task-checklists/:id — remove a whole checklist (and everything under it)

    removeChecklist : asyncHandler(async (req : Request , res : Response) => {
        await taskChecklistService.removeChecklist(req.params.id, req.user!)
        res.json({ success : true , data : { deleted : true}})
    }),

    // DELETE /task-checklist-items/:id — remove a single item

    removeItem : asyncHandler(async (req : Request , res : Response) => {
        await taskChecklistService.removeItem(req.params.id, req.user!)
        res.json({ success : true , data : { deleted : true}})
    })
}