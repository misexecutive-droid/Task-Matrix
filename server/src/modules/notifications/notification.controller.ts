import type { Request , Response } from "express"
import { notificationService } from "./notification.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const notificationController = {
    list : asyncHandler( async (req : Request , res : Response) => {
        const notifications = await notificationService.listForUser(req.user!.sub)
        res.json({ success : true , data : notifications })
    }),

    markRead : asyncHandler(async (req : Request , res : Response) => {
        const notification = await notificationService.markRead(req.params.id , req.user!.sub);
        res.json({ success : true, data : notification})
    }),

    markAllRead : asyncHandler(async (req : Request , res : Response) => {
        await notificationService.markAllRead(req.user!.sub);
        res.json({ success : true})
    })
}