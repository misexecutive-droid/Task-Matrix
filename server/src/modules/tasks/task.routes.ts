import { Router } from "express" // Express's Router lets us group related endpoints (all the /tasks ones) together
import { taskController } from "./task.controller.js" // the functions that actually handle each route
import { authenticate , requireRole } from "../../middleware/auth/auth.js" // middleware that checks the JWT and attaches req.user, or rejects the request
import { taskChecklistController } from "../taskChecklists/taskChecklist.controller.js" // creating a checklist under a specific task

export const taskRouter = Router()

// every route below requires a logged-in user - this line applies "authenticate" to ALL routes defined after it on this router
taskRouter.use(authenticate)

// this is the CRUD pattern: List, Get one, Create, Update (patch), Delete - mapped to controller functions.
// these routes get mounted somewhere under a path like "/api/tasks" in the main app setup.
taskRouter.get("/", taskController.list)       // GET    /tasks      -> list all tasks visible to this user
taskRouter.get("/:id" , taskController.getOne) // GET    /tasks/:id  -> get a single task by id
taskRouter.patch("/:id" , taskController.update) // PATCH /tasks/:id  -> partially update a task
taskRouter.delete("/:id" , requireRole("ADMIN"),taskController.remove) // DELETE /tasks/:id -> delete a task

taskRouter.post("/", requireRole("ADMIN"), taskController.create)


taskRouter.post("/:taskId/checklists", requireRole("ADMIN"), taskChecklistController.createForTask) // POST /tasks/:taskId/checklists -> create a checklist under this task