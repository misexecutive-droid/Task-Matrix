// Express's Router lets us group related endpoints (all the /auth/* ones) together,
// instead of dumping everything directly onto the main app object.
import { Router } from "express"
// Bring in the controller functions that actually handle each request.
import { authController } from "./auth.controller.js"

// Create a fresh, isolated router just for authentication-related endpoints.
export const authRouter = Router()

// POST /auth/login - checks email/password and returns tokens if valid.
authRouter.post('/login', authController.login)
// POST /auth/refresh - exchanges a valid refresh token (cookie) for a new access token.
authRouter.post('/refresh', authController.refresh)
// POST /auth/logout - revokes the refresh token and clears the cookie.
authRouter.post('/logout', authController.logout)