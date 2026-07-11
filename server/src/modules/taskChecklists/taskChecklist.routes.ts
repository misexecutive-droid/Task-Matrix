import { Router } from "express"
import { taskChecklistController } from "./taskChecklist.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /task-checklists in app.ts
export const taskChecklistRouter = Router()
taskChecklistRouter.use(authenticate)
taskChecklistRouter.delete('/:id', taskChecklistController.removeChecklist)

// Mounted at /task-checklist-items in app.ts
export const taskChecklistItemRouter = Router()
taskChecklistItemRouter.use(authenticate)
taskChecklistItemRouter.patch('/:id', taskChecklistController.updateItem)
taskChecklistItemRouter.post('/:id/complete', taskChecklistController.completeItem)
taskChecklistItemRouter.delete('/:id', taskChecklistController.removeItem)
