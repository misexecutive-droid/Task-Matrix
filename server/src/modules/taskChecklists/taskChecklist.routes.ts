import { Router } from "express"
import { taskChecklistController } from "./taskChecklist.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"
import { taskImageController } from "../taskImages/taskImage.controller.js"
import { taskImageUpload } from "../../config/upload.js"

// Mounted at /task-checklists in app.ts
export const taskChecklistRouter = Router()
taskChecklistRouter.use(authenticate)
taskChecklistRouter.delete('/:id', taskChecklistController.removeChecklist)

// Mounted at /task-checklist-items in app.ts
export const taskChecklistItemRouter = Router()
taskChecklistItemRouter.use(authenticate)
taskChecklistItemRouter.patch('/:id', taskChecklistController.updateItem)
taskChecklistItemRouter.post('/:id/complete', taskChecklistController.completeItem)
taskChecklistItemRouter.post('/:id/images', taskImageUpload.array('images', 10), taskImageController.upload)
taskChecklistItemRouter.delete('/:id', taskChecklistController.removeItem)
