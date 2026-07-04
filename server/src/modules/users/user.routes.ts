import { Router } from "express"
import { userController } from "./user.controller.js"
import { authenticate , requireRole } from "../../middleware/auth/auth.js"

export const userRouter = Router()

userRouter.use( authenticate , requireRole('ADMIN'))

userRouter.get("/" , userController.list)
userRouter.get("/:id" , userController.getOne);
userRouter.post("/" , userController.create)
userRouter.patch("/:id" , userController.update)
userRouter.delete("/:id" , userController.remove)