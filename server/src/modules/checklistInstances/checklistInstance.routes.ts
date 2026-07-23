import { Router } from "express"
import { checklistInstanceController } from "./checklistInstance.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"

// Mounted at /checklist-instances in app.ts. Instances are cron-generated only — no create/delete
// endpoints here. "/mine" must be registered before "/:id" so Express doesn't treat "mine" as an id.
export const checklistInstanceRouter = Router()
checklistInstanceRouter.use(authenticate)
checklistInstanceRouter.get("/mine", checklistInstanceController.getMine)
checklistInstanceRouter.get("/", requireRole("ADMIN"), checklistInstanceController.list)
checklistInstanceRouter.get("/:id", checklistInstanceController.getOne)

// Mounted at /checklist-instance-items in app.ts. No role gate — the service authorizes based on
// whether the requester is ADMIN or one of the parent instance's assignees.
export const checklistInstanceItemRouter = Router()
checklistInstanceItemRouter.use(authenticate)
checklistInstanceItemRouter.patch("/:id", checklistInstanceController.setItemDone)
