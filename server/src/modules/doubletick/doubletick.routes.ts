import { Router } from "express"
import { doubletickController } from "./doubletick.controller.js"

export const doubletickRouter = Router()

doubletickRouter.post("/webhook/:secret", doubletickController.receive);
