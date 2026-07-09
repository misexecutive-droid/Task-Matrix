import type { Request , Response } from "express" // Express types for the request/response objects
import { notificationService } from "./notification.service.js" // service layer with the actual notification logic (database + socket work)
import { asyncHandler } from "../../utils/asyncHandler.js" // wraps async handlers so errors are forwarded to Express's error middleware instead of crashing

// The notification controller exposes HTTP endpoints for the in-app notification system.
// Notifications are little messages shown to a user (e.g. "Ticket X was assigned to you") so they
// know something happened without having to go check manually. Each notification has an isRead flag
// so the UI can show an unread badge/count and let the user dismiss things they've already seen.
export const notificationController = {
    // GET /  -> returns the list of notifications belonging to the currently logged-in user
    list : asyncHandler( async (req : Request , res : Response) => {
        // req.user is set by the auth middleware after verifying the JWT; "sub" is the user's id (subject claim)
        const notifications = await notificationService.listForUser(req.user!.sub)
        res.json({ success : true , data : notifications })
    }),

    // PATCH /:id/read -> marks ONE specific notification (by its id) as read for the current user
    markRead : asyncHandler(async (req : Request , res : Response) => {
        const notification = await notificationService.markRead(req.params.id , req.user!.sub);
        res.json({ success : true, data : notification})
    }),

    // PATCH /read-all -> marks ALL of the current user's unread notifications as read in one go
    // (different from markRead, which only touches a single notification by id)
    markAllRead : asyncHandler(async (req : Request , res : Response) => {
        await notificationService.markAllRead(req.user!.sub);
        res.json({ success : true})
    })
}