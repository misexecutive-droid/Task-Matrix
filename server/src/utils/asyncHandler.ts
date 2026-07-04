import type { Request, Response, Nextfunction, RequestHandler } from "express"

export const asyncHandler =
    (fn: (req: Request, res: Response, next: Nextfunction) => Promise<unknown>): RequestHandler => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }