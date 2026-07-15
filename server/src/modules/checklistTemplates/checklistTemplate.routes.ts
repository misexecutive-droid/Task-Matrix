import { Router } from "express"
import { checklistTemplateController } from "./checklistTemplate.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"

// Mounted at /checklist-templates in app.ts. Reading templates (list/getOne) is useful to any
// authenticated user picking one to apply to a task/ticket — only ADMIN can manage them.
export const checklistTemplateRouter = Router()
checklistTemplateRouter.use(authenticate)
checklistTemplateRouter.get("/", checklistTemplateController.list)
checklistTemplateRouter.get("/:id", checklistTemplateController.getOne)
checklistTemplateRouter.post("/", requireRole("ADMIN"), checklistTemplateController.create)
checklistTemplateRouter.patch("/:id", requireRole("ADMIN"), checklistTemplateController.update)
checklistTemplateRouter.delete("/:id", requireRole("ADMIN"), checklistTemplateController.remove)
checklistTemplateRouter.post("/:templateId/items", requireRole("ADMIN"), checklistTemplateController.addItem)

// Mounted at /checklist-template-items in app.ts
export const checklistTemplateItemRouter = Router()
checklistTemplateItemRouter.use(authenticate)
checklistTemplateItemRouter.patch("/:id", requireRole("ADMIN"), checklistTemplateController.updateItem)
checklistTemplateItemRouter.delete("/:id", requireRole("ADMIN"), checklistTemplateController.removeItem)