// note: this import doesn't seem to be used anywhere in this file (looks like leftover/unused code) - left as-is
import { appendFile } from "fs";

// A custom error class for "expected" errors we throw on purpose (like "not found" or "bad request").
// Why not just `throw new Error("...")` or even `throw "some string"`?
// Because a plain Error/string doesn't carry an HTTP status code, so whatever catches it
// (usually a global error-handling middleware in Express) wouldn't know whether to send
// back a 400, 404, 409, etc. By extending Error and attaching a statusCode, every route
// handler can just `throw AppError.notFound(...)` and the error middleware can read
// `err.statusCode` to build the right HTTP response automatically.
export class AppError extends Error {
    // Extra property (not on the base Error class) that stores the HTTP status code
    // this error should map to, e.g. 404 for "not found".
    statusCode: number;

    constructor(message: string, statusCode: number) {
        // Call the parent Error constructor so `message`, `.stack`, etc. work normally.
        super(message)
        // Store the status code on this instance so it can be read later by error middleware.
        this.statusCode = statusCode

        // Fixes a known quirk when extending built-in classes (like Error) in TypeScript/JS
        // that get compiled down to older JS targets: without this line, `instanceof AppError`
        // checks can fail on the resulting object. This line makes sure the prototype chain
        // is correctly set to AppError, so `instanceof` works as expected.
        Object.setPrototypeOf(this, AppError.prototype);

        // Node.js-specific helper: if available, this trims the constructor itself out of the
        // stack trace, so the stack trace starts from wherever AppError was actually thrown,
        // instead of pointing here inside the AppError class. Makes debugging easier.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }


    // Below are convenience "factory" methods for the most common HTTP error types.
    // Why have these instead of writing `new AppError("...", 400)` everywhere?
    // - It's shorter and more readable at the call site: `AppError.notFound("User")`
    //   instantly tells you what's happening, versus remembering "404 means not found".
    // - It centralizes the mapping between meaning ("this is a conflict") and the actual
    //   HTTP status code (409), so if conventions ever change, you only update it in one place.

    // 400 Bad Request - client sent invalid/malformed data (e.g. missing required field).
    static badRequest(message: string) { return new AppError(message, 400) }
    // 401 Unauthorized - the request has no valid credentials (e.g. not logged in / bad token).
    static unauthorized(message = 'Unauthorized') { return new AppError(message, 401) }
    // 403 Forbidden - the user is authenticated but not allowed to do this action.
    static forbidden(message = 'Forbidden') { return new AppError(message, 403); }
    // 404 Not Found - the requested resource (e.g. a document by id) doesn't exist.
    static notFound(message = 'Not found') { return new AppError(message, 404); }
    // 409 Conflict - the request conflicts with existing data (e.g. duplicate name/email).
    static conflict(message: string) { return new AppError(message, 409); }
}
