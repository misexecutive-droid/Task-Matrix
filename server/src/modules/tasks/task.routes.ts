import { Router } from "express"
import { taskController } from "./task.controller.js"
import { authenticate } from "../../middleware/auth/auth.js"

export const taskRouter = Router()

taskRouter.use(authenticate)

taskRouter.get("/", taskController.list)
taskRouter.get("/:id" , taskController.getOne)
taskRouter.post("/" , taskController.create)
taskRouter.patch("/:id" , taskController.update)
taskRouter.delete("/:id" , taskController.remove)