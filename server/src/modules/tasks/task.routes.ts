import { Router } from "express" // Express's Router lets us group related endpoints (all the /tasks ones) together
import { taskController } from "./task.controller.js" // the functions that actually handle each route
import { authenticate } from "../../middleware/auth/auth.js" // middleware that checks the JWT and attaches req.user, or rejects the request

export const taskRouter = Router()

// every route below requires a logged-in user - this line applies "authenticate" to ALL routes defined after it on this router
taskRouter.use(authenticate)

// this is the CRUD pattern: List, Get one, Create, Update (patch), Delete - mapped to controller functions.
// these routes get mounted somewhere under a path like "/api/tasks" in the main app setup.
taskRouter.get("/", taskController.list)       // GET    /tasks      -> list all tasks visible to this user
taskRouter.get("/:id" , taskController.getOne) // GET    /tasks/:id  -> get a single task by id
taskRouter.post("/" , taskController.create)   // POST   /tasks      -> create a new task
taskRouter.patch("/:id" , taskController.update) // PATCH /tasks/:id  -> partially update a task
taskRouter.delete("/:id" , taskController.remove) // DELETE /tasks/:id -> delete a task