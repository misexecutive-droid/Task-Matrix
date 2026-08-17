import { Router } from "express"
import { smartTaskConversationController } from "./smartTaskConversation.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"

export const smartTaskConversationRouter = Router()
smartTaskConversationRouter.use(authenticate)

smartTaskConversationRouter.post("/", smartTaskConversationController.create);
smartTaskConversationRouter.patch("/:id", smartTaskConversationController.patch);
smartTaskConversationRouter.get("/", smartTaskConversationController.list);
smartTaskConversationRouter.get("/:id", smartTaskConversationController.getOne);
smartTaskConversationRouter.delete("/", requireRole("ADMIN", "PC"), smartTaskConversationController.deleteAll);
