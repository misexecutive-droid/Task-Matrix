import { Router } from "express"
import { checklistInstanceItemSubmissionController } from "./checklistInstanceItemSubmission.controller.js"
import { checklistInstanceItemSubmissionImageController } from "../checklistInstanceItemSubmissionImages/checklistInstanceItemSubmissionImage.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"
import { checklistInstanceItemSubmissionImageUpload } from "../../config/upload.js"

// Mounted at /checklist-instance-item-submissions in app.ts. No role gate — the service
// authorizes based on whether the requester is the named auditor on this submission, or ADMIN
// (see checklistInstanceItemSubmission.service.ts's assertCanAccess), same convention as
// checklistInstance.routes.ts's item-level router.
export const checklistInstanceItemSubmissionRouter = Router()
checklistInstanceItemSubmissionRouter.use(authenticate)
checklistInstanceItemSubmissionRouter.patch("/:id", checklistInstanceItemSubmissionController.setDone)
checklistInstanceItemSubmissionRouter.patch("/:id/accessories", checklistInstanceItemSubmissionController.updateAccessories)
checklistInstanceItemSubmissionRouter.patch("/:id/remarks", checklistInstanceItemSubmissionController.updateRemarks)
checklistInstanceItemSubmissionRouter.post("/:id/images", checklistInstanceItemSubmissionImageUpload, checklistInstanceItemSubmissionImageController.upload)
