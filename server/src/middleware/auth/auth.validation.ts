// Import Zod - a schema validation library that lets us describe the "shape" data should have,
// and automatically reject/report anything that doesn't match (e.g. missing fields, bad email format).
import { z } from "zod"

// Schema describing what a valid "register" (sign up) request body should look like.
// If the incoming JSON doesn't match this shape, Zod throws a ZodError, which the central
// errorHandler.ts turns into a friendly 400 response with per-field error messages.
export const registerSchema = z.object({
    // First name must be a string with at least 1 character (i.e. not empty).
    firstName : z.string().min(1),
    // Last name is a string, but optional - the user doesn't have to provide it.
    lastName : z.string().optional(),
    // Email must be a string AND look like a valid email address (Zod has a built-in email check).
    email : z.string().email(),
    // Password must be a string of at least 8 characters - a very basic strength rule.
    password : z.string().min(8)
})

// Schema describing what a valid "login" request body should look like.
export const loginSchema = z.object({
    // Email must be a valid email string, same rule as registration.
    email : z.string().email(),
    // Password just needs to be present (min 1 character) - we don't re-check strength on login,
    // only on registration, since an existing account's password could pre-date current rules.
    password : z.string().min(1)
})

// Schema for "forgot password" — just the email of the account to send a reset link to.
export const forgotPasswordSchema = z.object({
    email : z.string().email(),
})

// Schema for actually resetting the password once the user has clicked the emailed link.
// `token` is the raw reset token from the URL; same minimum-length rule as registration for
// the new password itself.
export const resetPasswordSchema = z.object({
    token : z.string().min(1),
    password : z.string().min(8),
})

// TypeScript trick: z.infer<> reads the Zod schema and generates a matching TypeScript type
// automatically, so we don't hand-write an interface that could drift out of sync with the schema.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;