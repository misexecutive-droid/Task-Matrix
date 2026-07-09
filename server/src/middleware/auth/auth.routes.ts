import { Router } from "express"
import { authController } from "./auth.controller.js"

export const authRouter = Router()

authRouter.post('/login', authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authController.logout)