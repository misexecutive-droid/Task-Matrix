import { Router } from "express" // Express's Router lets us group related endpoints (all the /tasks ones) together
import { taskController } from "./task.controller.js" // the functions that actually handle each route
import { authenticate , requireRole } from "../../middleware/auth/auth.js" // middleware that checks the JWT and attaches req.user, or rejects the request
import { taskChecklistController } from "../taskChecklists/taskChecklist.controller.js" // creating a checklist under a specific task
import { taskAttachmentController } from "../taskAttachments/taskAttachment.controller.js" // attaching general files (pdf/csv/image/video) directly to a task
import { taskAttachmentUpload, voiceNoteUpload } from "../../config/upload.js"
import { taskAiController } from "./ai/task.ai.controller.js"

export const taskRouter = Router()

taskRouter.use(authenticate)

taskRouter.get("/", taskController.list)       
taskRouter.get("/reports/compliance", taskController.complianceReport) 
taskRouter.get("/:id" , taskController.getOne) 
taskRouter.patch("/:id" , taskController.update)
taskRouter.patch("/:id/verify", requireRole("PC", "ADMIN"), taskController.verify) 
taskRouter.delete("/:id" , requireRole("ADMIN", "PC"),taskController.remove)

taskRouter.post("/", requireRole("ADMIN"), taskController.create)


taskRouter.post("/:taskId/checklists", requireRole("ADMIN"), taskChecklistController.createForTask) // POST /tasks/:taskId/checklists -> create a checklist under this task
taskRouter.post("/:taskId/checklists/from-template/:templateId", requireRole("ADMIN"), taskChecklistController.createFromTemplate)

taskRouter.post("/:id/attachments", taskAttachmentUpload, taskAttachmentController.upload) // POST /tasks/:id/attachments -> attach general files (pdf/csv/image/video) to this task

taskRouter.post("/ai/parse", taskAiController.parse)
taskRouter.post("/ai/create", taskAiController.create)
taskRouter.post("/ai/transcribe", voiceNoteUpload, taskAiController.transcribe)