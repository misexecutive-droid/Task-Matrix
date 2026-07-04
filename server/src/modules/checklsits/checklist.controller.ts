import type { Request, Response } from "express"
import { checklistService } from "./checklist.service.js"
import { createChecklistSchema, updateChecklistItemSchema } from "./checklist.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { success } from "zod/v4"

export const checklistControll = {
    addToTicket: asyncHandler(async (req: Request, res: Response) => {
        const input = createChecklistSchema.parse(req.body);
        const checklist = await checklistService.addToTicket(req.params.ticketId, input)
        res.status(201).json({ success: true, data: checklist })
    }),

    removeChecklist: asyncHandler(async (req: Request, res: Response) => {
        await checklistService.removeChecklist(req.params.id);
        res.json({ success: true, data: { deleted: true } });
    }),

    updateItem : asyncHandler(async (req : Request , res : Response) => {
        await checklistService.removeItem(req.params.id);
        res.json({ success : true , data : { deleted : true}})
    })
}
