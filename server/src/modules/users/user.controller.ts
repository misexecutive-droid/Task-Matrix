import type { Request , Response} from 'express'
import { userService } from './user.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

// Controllers are the layer that talks directly to Express (reads the request, sends the
// response). They don't contain business logic themselves - they just call into the
// `userService`, which does the real work (talking to the database, checking rules, etc).
// This keeps the "how do I respond to HTTP" concerns separate from "what are the business rules".
export const userController = {
    // `asyncHandler` is a wrapper that catches any errors thrown inside these async functions
    // and passes them to Express's error-handling middleware, so we don't need try/catch here.
    list : asyncHandler ( async (_req : Request , res : Response) => {
        // `_req` is prefixed with an underscore because it isn't used - we don't need anything
        // from the request to list all users, so this is just a convention to signal "unused param".
        const users = await userService.list()
        // Respond with a consistent shape: { success, data } so the frontend always knows what to expect.
        res.json({ success : true , data : users})
    }),

    getOne : asyncHandler(async (req : Request , res : Response) => {
        // `req.params.id` comes from the `:id` part of the route path (e.g. /users/12345 -> id = "12345").
        const user = await userService.getById(req.params.id);
        res.json({ success : true , data : user})
    }),

    create : asyncHandler(async (req : Request , res : Response) => {
        // `req.body` is the JSON payload the admin sent (email, password, role, etc).
        // `req.user!.sub` is the id of the currently logged-in admin, taken from their access token.
        // The `!` tells TypeScript "trust me, req.user will be set here" because the `authenticate`
        // middleware (in the routes file) already guarantees this route only runs for logged-in users.
        // We pass the admin's id along so the service can record who performed this action (for auditing).
        const user = await userService.create(req.body , req.user!.sub);
        // 201 = "Created" - the standard HTTP status code for successfully creating a new resource.
        res.status(201).json({ success : true , data : user})
    }),

    update : asyncHandler(async (req : Request , res : Response) => {
        // Same pattern as create: which user to update (from the URL), what fields to change
        // (from the body), and who is making the change (the logged-in admin's id).
        const user = await userService.update(req.params.id , req.body , req.user!.sub);
        res.json({ success : true , data : user})
    }),

    remove : asyncHandler(async (req : Request , res : Response) =>{
        // Delete the user identified by the URL param, tracking who did the deleting.
        const user = await userService.remove(req.params.id, req.user!.sub);
        // We don't send back the whole deleted user - just confirm it happened and give its id,
        // since the frontend usually just needs to know "yes, that's gone" to update its list.
        res.json({ success : true , data : { deleted : true, id : user._id.toString() } })
    }),

    listAssignable : asyncHandler(async (req : Request , res : Response) => {
        // Query params come from the URL like /users/assignable?departmentId=abc123.
        // We only accept it if it's actually a string (query params can sometimes be arrays or
        // undefined), otherwise we treat it as "not provided".
        const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
        // `req.user!` here is the full decoded token payload (id, role, departmentId, storeId, etc)
        // for whoever is logged in - the service needs this to figure out scoping rules (see
        // user.service.ts `listAssignable` for the department/store scoping logic for MANAGERs).
        const users = await userService.listAssignable(req.user!, departmentId);
        res.json({ success : true, data : users})
    })
}
