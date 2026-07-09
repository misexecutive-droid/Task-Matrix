import type { Request, Response } from "express";
// Centralized environment config (reads values from .env, with validation/defaults).
import { env } from "../../config/env.js";
// The service layer holds the actual business logic (checking passwords, issuing tokens, etc).
// The controller's job is just to translate HTTP requests <-> service calls <-> HTTP responses.
import { authService } from "./auth.service.js";
// Zod schema used to validate/parse the login request body before we trust it.
import { loginSchema } from "./auth.validation.js";
// A wrapper that catches errors thrown inside async route handlers and forwards them to
// Express's error-handling middleware (errorHandler.ts), so we don't need try/catch everywhere.
import { asyncHandler } from "../../utils/asyncHandler.js";

// The name of the cookie we use to store the refresh token in the browser.
const REFRESH_COOKIE = 'refreshToken';

// Options controlling how the refresh token cookie behaves.
// note: "cookeiOptions" is a typo of "cookieOptions" in the original code - left as-is since it's
// just an internal variable name and doesn't affect behavior.
const cookeiOptions = {
    // httpOnly means JavaScript running in the browser (e.g. document.cookie) CANNOT read this cookie.
    // This protects the refresh token from theft via malicious scripts (XSS) - only the browser
    // itself can send it back to the server automatically.
    httpOnly: true,
    // secure means the cookie is only sent over HTTPS - configurable via env so it can be relaxed
    // in local development where there's no HTTPS.
    secure: env.COOKIE_SECURE,
    // sameSite controls whether the cookie is sent on cross-site requests, helping prevent CSRF attacks.
    sameSite: env.COOKIE_SAMESITE,
    // path: '/auth' means the browser only attaches this cookie on requests to /auth/* routes,
    // limiting how widely the sensitive refresh token gets sent.
    path: '/auth',
    // How long (in milliseconds) the cookie lives before the browser deletes it automatically.
    // Converts a "days" value from env into milliseconds (days * hours * minutes * seconds * ms).
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
} as const;

// Shared helper used by login/refresh: sends the refresh token as a secure cookie, and sends the
// short-lived access token + user info back in the JSON response body. They're split intentionally:
// the access token is meant to live in frontend memory and be attached to API calls manually, while
// the refresh token is never touched by JS at all (it just rides along automatically via the cookie).
const sendAuthResponse = (res: Response, result: { accessToken: string; refreshToken: string; user: unknown }) => {
    // Set the refresh token cookie on the response using the options defined above.
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookeiOptions);
    // Send the access token and public user info as normal JSON - the frontend stores the access
    // token itself and attaches it later as "Authorization: Bearer <token>" on future requests.
    res.json({ accessToken: result.accessToken, user: result.user });
};

// The actual route handler functions, grouped into one object for easy importing in auth.routes.ts.
export const authController = {
    // Handles POST /auth/login
    login: asyncHandler(async (req: Request, res: Response) => {
        // Validate & parse the incoming body against loginSchema - throws a ZodError (-> 400) if invalid.
        const input = loginSchema.parse(req.body);
        // Delegate the actual "check credentials, issue tokens" logic to the service layer.
        const result = await authService.login(input);
        // Send back the access token (JSON) + refresh token (cookie).
        sendAuthResponse(res, result);
    }),

    // Handles POST /auth/refresh - lets the frontend get a new access token once the old one
    // expires, without forcing the user to log in again.
    refresh: asyncHandler(async (req: Request, res: Response) => {
        // Read the refresh token out of the httpOnly cookie sent automatically by the browser.
        const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
        // Issue a fresh access token (and a rotated refresh token) back to the client.
        sendAuthResponse(res, result);
    }),

    // Handles POST /auth/logout
    logout: asyncHandler(async (req: Request, res: Response) => {
        // Tell the service to invalidate (revoke) this refresh token in the database, so it can't
        // be used again even if someone had captured a copy of it.
        await authService.logout(req.cookies?.[REFRESH_COOKIE]);
        // Remove the refresh token cookie from the browser too (must match the same path used when setting it).
        res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
        // Let the frontend know the logout succeeded.
        res.json({ success: true });
    })
};