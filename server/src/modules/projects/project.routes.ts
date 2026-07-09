import { Router } from "express" // groups all the /projects endpoints together
import { projectController } from "./project.controller.js" // handlers for each route
import { authenticate } from "../../middleware/auth/auth.js" // requires a valid logged-in user (checks the JWT, sets req.user)

export const projectRouter = Router()

// apply the authenticate middleware to every route on this router - no anonymous access to projects
projectRouter.use(authenticate)

// standard CRUD routes, same pattern as task.routes.ts:
projectRouter.get("/", projectController.list)         // GET    /projects      -> list projects visible to this user
projectRouter.get("/:id" , projectController.getOne)    // GET    /projects/:id  -> get one project
projectRouter.post("/" , projectController.create)      // POST   /projects      -> create a project
projectRouter.patch("/:id" , projectController.update); // PATCH  /projects/:id  -> partially update a project (owner/admin only)
projectRouter.delete("/:id" , projectController.remove) // DELETE /projects/:id  -> delete a project (owner/admin only)