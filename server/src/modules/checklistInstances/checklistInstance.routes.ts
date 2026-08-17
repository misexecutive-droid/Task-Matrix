import { Router } from "express"
import { checklistInstanceController } from "./checklistInstance.controller.js"
import { checklistInstanceImageController } from "../checklistInstanceImages/checklistInstanceImage.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"
import { checklistInstanceImageUpload } from "../../config/upload.js"

// Mounted at /checklist-instances in app.ts. Instances are cron-generated only — no create/delete
// endpoints here. "/mine" and "/pending-verification" must be registered before "/:id" so Express
// doesn't treat either as an id.
export const checklistInstanceRouter = Router()
checklistInstanceRouter.use(authenticate)
checklistInstanceRouter.get("/mine", checklistInstanceController.getMine)
checklistInstanceRouter.get("/pending-verification", requireRole("PC", "ADMIN"), checklistInstanceController.listPendingVerification)
checklistInstanceRouter.get("/", requireRole("ADMIN", "PC"), checklistInstanceController.list)
checklistInstanceRouter.get("/reports/compliance", requireRole("ADMIN", "PC"), checklistInstanceController.complianceReport)
checklistInstanceRouter.get("/:id", checklistInstanceController.getOne)
checklistInstanceRouter.patch("/:id/verify", requireRole("PC", "ADMIN"), checklistInstanceController.verify)

// Mounted at /checklist-instance-items in app.ts. No role gate on setItemDone/images — the
// service authorizes based on whether the requester is ADMIN or one of the parent instance's
// assignees (see checklistInstance.service.ts / checklistInstanceImage.service.ts).
export const checklistInstanceItemRouter = Router()
checklistInstanceItemRouter.use(authenticate)
checklistInstanceItemRouter.patch("/:id", checklistInstanceController.setItemDone)
checklistInstanceItemRouter.post("/:id/images", checklistInstanceImageUpload, checklistInstanceImageController.upload)
