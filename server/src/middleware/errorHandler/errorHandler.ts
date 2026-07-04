import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';


export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  
  // A. CUSTOM OPERATIONAL ERRORS
  // Check if the error is an instance of our trusted custom error class (e.g., 401 Unauthorized, 404 Not Found)
  if (err instanceof AppError) {
    // Return the specific status code and custom message configured when the error was thrown
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // B. ZOD REQUEST VALIDATION ERRORS
  // Check if the incoming request payload failed a Zod schema validation parse check
  if (err instanceof ZodError) {
    // Return a 400 Bad Request along with clean, mapped key-value errors via .flatten().fieldErrors
    return res.status(400).json({ success: false, message: 'Validation failed', errors: err.flatten().fieldErrors });
  }

  // C. MONGOOSE SCHEMA VALIDATION ERRORS
  // Check if Mongoose rejected a database write because data violated schema definitions (e.g., invalid ObjectId structure)
  if (err instanceof mongoose.Error.ValidationError) {
    // Return a 400 Bad Request alongside Mongoose's built-in validation failure summary message
    return res.status(400).json({ success: false, message: err.message });
  }

  // D. MONGODB DUPLICATE KEY ERRORS
  // Check if the native MongoDB driver throws a server error, specifically focusing on error code 11000 (Unique Constraint Violation)
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    // Return a 409 Conflict status showing the user exactly which unique field value already exists in the database
    return res.status(409).json({ success: false, message: 'Duplicate value', keyValue: err.keyValue });
  }

  // E. UNHANDLED INTERNAL SYSTEM ERRORS (FALLBACK)
  // Safely log the unhandled system error (like a database connection failure or syntax crash) to the server console
  console.error(err);
  
  // Send a generic 500 status to the client, dynamically hiding or exposing the stack trace/message based on production environments
  return res.status(500).json({
    success: false,
    // Security Guard: Mask descriptive system errors in production to avoid leaking database architectures or paths to users
    message: env.NODE_ENV === 'production' ? 'Internal server error' : String((err as Error)?.message ?? err),
  });
};
