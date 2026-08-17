import { Router } from "express"
import { settingsController } from "./settings.controller.js"
import { authenticate , requireRole } from "../../middleware/auth/auth.js"

export const settingsRouter = Router()

settingsRouter.use(authenticate)

settingsRouter.get("/", requireRole("ADMIN", "PC"), settingsController.get)
settingsRouter.patch("/", requireRole("ADMIN", "PC"), settingsController.update)