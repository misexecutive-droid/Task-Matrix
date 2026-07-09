// Import Express's built-in types just for type annotations (no runtime code from these).
import type { Request, Response, NextFunction, RequestHandler } from "express"

// asyncHandler is a wrapper you put around any *async* Express route handler.
//
// The problem it solves: Express route handlers are normally synchronous functions, and
// Express automatically catches synchronous errors thrown inside them and forwards those
// errors to your error-handling middleware. But if your handler is `async` (which almost
// all real handlers are, since they await database calls, etc.), a *rejected promise*
// is NOT automatically caught by Express - it would just be an unhandled promise rejection,
// and the request would hang forever with no response and no error being logged properly.
//
// The usual fix is wrapping every single route handler's body in its own try/catch and
// manually calling `next(err)` in the catch block - but that's repetitive boilerplate you'd
// have to remember in every single route, and it's easy to forget. Instead, asyncHandler
// does that try/catch (well, `.catch()`) once, in a single reusable place, so every route
// just gets automatic error forwarding for free.
//
// How it works: asyncHandler takes your async route function (`fn`) and returns a *new*
// function that Express can use directly as a route handler. When Express calls that new
// function with (req, res, next), it runs your original `fn`, and whatever it returns is
// wrapped in `Promise.resolve(...)` (so it's guaranteed to be treated as a Promise even if
// `fn` somehow returned a plain value). If that promise rejects (i.e. your async code threw
// or awaited something that failed), `.catch(next)` passes the error into Express's `next()`,
// which routes it straight to your centralized error-handling middleware (the one that knows
// how to read `AppError`'s statusCode, for example).
export const asyncHandler =
    // fn: the actual async route logic you write, e.g. `async (req, res) => { ... }`
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
        // The function actually registered with Express (e.g. router.get("/", asyncHandler(...)))
        (req, res, next) => {
            // Run the handler; if the returned promise rejects, forward the error to `next`,
            // which Express uses to skip to error-handling middleware instead of crashing
            // or hanging the request.
            Promise.resolve(fn(req, res, next)).catch(next)
        }
