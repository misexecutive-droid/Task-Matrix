import type { Request , Response } from "express" // Express's types for the incoming request and outgoing response
import { taskService } from "./task.service.js" // the layer that actually talks to the database
import { createTaskSchema , updateTaskSchema, verifyTaskSchema } from "./task.validation.js" // zod schemas used to validate/parse incoming request bodies
import { asyncHandler } from "../../utils/asyncHandler.js" // wraps async route handlers so thrown errors get passed to Express's error handling instead of crashing the app

// the controller layer: turns HTTP requests into calls to the service layer, and turns the service's results back into HTTP responses.
// this is the "C" in the routes -> controller -> service -> validation pattern used across this codebase.
export const taskController = {
    // GET /tasks - list tasks visible to the logged-in user.
    // GET /tasks?userId=<id> - (admin only, enforced inside the service) list one specific user's tasks.
    list : asyncHandler(async ( req : Request , res : Response) => {
        // Same defensive pattern as user.controller.ts's listAssignable: query params can technically
        // come through as arrays or be missing entirely, so we only accept it if it's actually a string.
        const filterUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const tasks = await taskService.list(req.user!, filterUserId, status) // req.user is attached by the auth middleware after verifying the JWT; "!" tells TS "trust me, this exists here"
        res.json(tasks) // send the list back as plain JSON
    }),

    // GET /tasks/:id - fetch one task by id from the URL
    getOne : asyncHandler(async (req : Request , res : Response) => {
        const task = await taskService.getById(req.params.id , req.user!);
        res.json(task)
    }),

    // POST /tasks - create a new task
    create : asyncHandler(async (req : Request , res : Response) => {
        const input = createTaskSchema.parse(req.body); // validate the request body against the schema; throws if it doesn't match, which asyncHandler will catch
        const task = await taskService.create(input , req.user!)
        res.status(201).json(task) // 201 = "Created", standard REST convention for successful creation
    }),

    // PATCH /tasks/:id - update an existing task
    update : asyncHandler(async (req : Request , res : Response) => {
        const input = updateTaskSchema.parse(req.body); // partial validation since not all fields are required on update
        const task = await taskService.update(req.params.id , input , req.user!)
        res.json(task);
    }),

    // PATCH /tasks/:id/verify - PC/Admin approves or rejects a task that's pending_verification
    verify : asyncHandler(async (req : Request , res : Response) => {
        const input = verifyTaskSchema.parse(req.body);
        const task = await taskService.verify(req.params.id , input , req.user!)
        res.json(task);
    }),

    // DELETE /tasks/:id - remove a task
    remove : asyncHandler(async (req : Request , res : Response) => {
        await taskService.remove(req.params.id , req.user!)
        res.json({ success : true}) // no data to return, just confirm success
    })
}
