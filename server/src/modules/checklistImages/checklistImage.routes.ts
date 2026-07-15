import { Router } from "express"
import { checklistImageController } from "./checklistImage.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /checklist-images in app.ts
export const checklistImageRouter = Router()
checklistImageRouter.use(authenticate)
checklistImageRouter.delete('/:id', checklistImageController.remove)