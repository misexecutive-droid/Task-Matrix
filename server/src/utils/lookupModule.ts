import { Router } from "express"
// `Model` is Mongoose's TypeScript type representing a Mongoose model (e.g. the Store model,
// the Department model, etc.) - basically "a class you can use to query/create documents".
import type { Model } from "mongoose"
// Middleware that checks the user is logged in (authenticate) and that they have a
// specific role, like "ADMIN" (requireRole).
import { authenticate, requireRole } from "../middleware/auth/auth.js"
// Our reusable wrapper (see asyncHandler.ts) that catches errors from async route handlers
// and forwards them to Express's error-handling middleware instead of crashing/hanging.
import { asyncHandler } from "./asyncHandler.js"
// Our custom error class that carries an HTTP status code (see AppError.ts).
import { AppError } from "./AppError.js"

// This is a "router factory": a function that BUILDS and returns an Express Router,
// instead of a router being hand-written directly.
//
// Why does this exist? Many parts of this app have simple "lookup" data - small reference
// lists like Store, Department, Category, etc. - that all need basically the exact same
// CRUD (Create, Read, Update, Delete) API: list them all, add a new one, edit one, delete
// one. Rather than copy-pasting nearly identical route code into three or four separate
// files (one per lookup type) and having to keep them all in sync whenever something
// changes, we write the logic ONCE here as a generic function, and every specific lookup
// type just calls `createLookupRouter(SomeMongooseModel)` to get its own fully working
// router. This is the DRY (Don't Repeat Yourself) principle in action.
//
// `LookupModel: Model<any>` means "whatever Mongoose model gets passed in" - using `any`
// here keeps this function generic enough to work with any lookup model's shape.
export const createLookupRouter = (LookupModel: Model<any>) => {
    // Create a fresh, isolated set of routes. This gets "mounted" onto a path like
    // `/api/stores` or `/api/departments` wherever this function is used.
    const router = Router()

    // GET / -> list all items of this lookup type.
    // Anyone who is authenticated (logged in) can view the list - no special role needed.
    router.get("/", authenticate, asyncHandler(async (_req, res) => {
        // Fetch every document for this model, sorted alphabetically by `name`.
        // (`_req` is prefixed with an underscore to signal it's intentionally unused here.)
        const items = await LookupModel.find().sort({ name: 1 });
        // Send a consistent JSON shape: { success, data } so the frontend always knows
        // what to expect regardless of which lookup type this is.
        res.json({ success: true, data: items })
    }))

    // From this point on, every route below requires the user to be authenticated AND
    // have the "ADMIN" role. `router.use(...)` applies this middleware to all routes
    // defined after it in this router (POST, PATCH, DELETE below), so only admins can
    // create, edit, or delete lookup entries - regular users can only view them (see GET above).
    router.use(authenticate, requireRole("ADMIN"))


    // POST / -> create a new lookup item (admin only).
    router.post("/", asyncHandler(async (req, res) => {
        // Before creating, check whether an item with this same name already exists,
        // to avoid duplicate entries (e.g. two "Electronics" categories).
        const existing = await LookupModel.findOne({ name: req.body.name });
        // If it already exists, stop here and throw a 409 Conflict error. Because this
        // route is wrapped in asyncHandler, throwing here is safe - asyncHandler makes
        // sure this gets forwarded to the error-handling middleware instead of crashing.
        if (existing) throw AppError.conflict("Name already exists")
        // Otherwise, create the new document using whatever fields were sent in the body.
        const item = await LookupModel.create(req.body)
        // 201 = "Created" - the conventional success status code for a successful POST
        // that creates a new resource.
        res.status(201).json({ success: true, data: item })
    }))

    // PATCH /:id -> update an existing lookup item by its Mongo `_id` (admin only).
    router.patch("/:id", asyncHandler(async (req, res) => {
        // Find the document by id and update it with the fields in the request body.
        // { new: true } -> return the UPDATED document (not the old one before changes).
        // { runValidators: true } -> re-run the Mongoose schema's validation rules on update
        // (by default Mongoose skips validation on updates unless you ask for it).
        const item = await LookupModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // If no document was found with that id, `item` will be null - throw a 404 instead
        // of silently sending back `null`.
        if (!item) throw AppError.notFound("Not Found")
        res.json({ success: true, data: item })
    }))

    // DELETE /:id -> remove a lookup item by its Mongo `_id` (admin only).
    router.delete("/:id", asyncHandler(async (req, res) => {
        // Find and delete the document in one step.
        const item = await LookupModel.findByIdAndDelete(req.params.id);
        // If nothing was found/deleted, treat it as "not found" rather than pretending
        // the delete succeeded.
        if (!item) throw AppError.notFound("Not Found")
        // Note: response shape here is `{ delete: true }` (not `deleted`) - kept as-is,
        // just flagging it in case it looks like a typo when reading the frontend code
        // that consumes this response.
        res.json({ success: true, data: { delete: true } })
    }))

    // Hand back the fully-configured router so the caller can mount it, e.g.
    // `app.use("/api/stores", createLookupRouter(StoreModel))`.
    return router;

}
