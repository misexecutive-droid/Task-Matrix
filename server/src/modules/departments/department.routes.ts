import { createLookupRouter } from "../../utils/lookupModule.js";
import { Department  } from "../../models/Department.js";
import { authenticate , requireRole } from "../../middleware/auth/auth.js";
import { departmentController } from "./department.controller.js";
import { Router } from "express";


// export const departmentRouter = createLookupRouter(Department)

export const departmentRouter = Router()

departmentRouter.use(authenticate)

// any authenticated user (ADMIN , MANAGER , AGENT , USER)
// e.g when you raising the ticket choosing which department it belong to.

departmentRouter.get("/", departmentController.list)
departmentRouter.get("/:id" , departmentController.getOne)

// Only ADMIN can create, update, or delete departments.
departmentRouter.post("/", requireRole("ADMIN"), departmentController.create)
departmentRouter.patch("/:id", requireRole("ADMIN"), departmentController.update)
departmentRouter.delete("/:id", requireRole("ADMIN"), departmentController.remove)

