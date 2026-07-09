import { Router } from "express"
import { userController } from "./user.controller.js"
import { authenticate, requireRole } from "../../middleware/auth/auth.js"

// This creates a mini "mini app" of routes that we'll mount under something like /api/users
// in the main app. Keeping routes in their own file per module keeps things organized.
export const userRouter = Router()

// Every route below this line requires the caller to be logged in (have a valid access token).
// The `authenticate` middleware checks the token and attaches the decoded user info to req.user.
userRouter.use(authenticate)

// IMPORTANT: this route is defined BEFORE the `requireRole('ADMIN')` line below, so it is
// only gated by `authenticate` (any logged-in user), not by admin-only access.
// This is the endpoint the ticket-assignment picker calls to get a list of users that can be
// assigned to a ticket. Any authenticated user (not just admins) needs to be able to see this,
// otherwise a regular manager/agent couldn't assign tickets to teammates.
userRouter.get("/assignable", userController.listAssignable)

// From this point on, every route ALSO requires the logged-in user to have the 'ADMIN' role.
// `requireRole('ADMIN')` is middleware that runs after `authenticate` and blocks anyone who
// isn't an admin. This is why the routes below are considered "admin-only user management" -
// only admins are allowed to list all users, view one user, create, update, or delete users.
userRouter.use(requireRole('ADMIN'))
// GET /  -> list every user in the system (admin only)
userRouter.get("/", userController.list)
// GET /:id -> look up a single user by their Mongo _id (admin only)
userRouter.get("/:id", userController.getOne)
// POST / -> create a brand new user account (admin only)
userRouter.post("/", userController.create)
// PATCH /:id -> partially update a user (e.g. change role, deactivate, etc.) (admin only)
userRouter.patch("/:id", userController.update)
// DELETE /:id -> permanently remove a user (admin only)
userRouter.delete("/:id", userController.remove)
