import { Router } from "express"
import { checklistInstanceItemSubmissionImageController } from "./checklistInstanceItemSubmissionImage.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

// Mounted at /checklist-instance-item-submission-images in app.ts
export const checklistInstanceItemSubmissionImageRouter = Router()
checklistInstanceItemSubmissionImageRouter.use(authenticate)
checklistInstanceItemSubmissionImageRouter.delete('/:id', checklistInstanceItemSubmissionImageController.remove)
