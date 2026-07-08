import { Router } from "express";
import { notificationController } from "./notification.controller.js";
import { authenticate } from "../../middleware/auth/auth.js";

export const notificationRouter = Router()
notificationRouter.use(authenticate)

notificationRouter.get("/", notificationController.list);
notificationRouter.patch("/:id/read", notificationController.markRead)
notificationRouter.patch("/read-all", notificationController.markAllRead)
