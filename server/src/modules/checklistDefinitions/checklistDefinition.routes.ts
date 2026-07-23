import { Router } from "express"
import { checklistDefinitionController } from "./checklistDefinition.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"

// Mounted at /checklist-definitions in app.ts. Unlike checklist-templates, every route here is
// ADMIN-only — non-admins interact with this feature only through the generated instances
// (see modules/checklistInstances), never the definitions directly.
export const checklistDefinitionRouter = Router()
checklistDefinitionRouter.use(authenticate)
checklistDefinitionRouter.use(requireRole("ADMIN"))
checklistDefinitionRouter.get("/", checklistDefinitionController.list)
checklistDefinitionRouter.get("/:id", checklistDefinitionController.getOne)
checklistDefinitionRouter.post("/", checklistDefinitionController.create)
checklistDefinitionRouter.patch("/:id/active", checklistDefinitionController.setActive)
checklistDefinitionRouter.delete("/:id", checklistDefinitionController.remove)
