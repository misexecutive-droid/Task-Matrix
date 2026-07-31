import { Router } from "express"
import { checklistInstanceImageController } from "./checklistInstanceImage.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /checklist-instance-images in app.ts
export const checklistInstanceImageRouter = Router()
checklistInstanceImageRouter.use(authenticate)
checklistInstanceImageRouter.delete('/:id', checklistInstanceImageController.remove)
