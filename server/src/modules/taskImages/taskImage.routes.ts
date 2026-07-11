import { Router } from "express"
import { taskImageController } from "./taskImage.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /task-images in app.ts
export const taskImageRouter = Router()
taskImageRouter.use(authenticate)
taskImageRouter.delete('/:id', taskImageController.remove)