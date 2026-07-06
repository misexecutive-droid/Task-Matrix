// 1. IMPORT STATEMENTS
// Import core types from Express to handle request, response, and middleware routing
import type { Request, Response, NextFunction } from "express";
// Import the jsonwebtoken library to verify digital signatures on incoming tokens
import jwt from 'jsonwebtoken';
// Import environment configurations (specifically your private JWT secrets)
import { env } from "../../config/index.js";
// Import your custom AppError class to trigger clean, structured error handling responses
import { AppError } from "../../utils/index.js";
// Import the Role type from your models directory to enforce TypeScript type safety on user roles
import type { Role } from "../../models/index.js";

// 2. JWT PAYLOAD TYPE DEFINITION
// Define the shape of the decoded data hidden inside the JWT access token
// 'sub' stands for Subject (usually the User's MongoDB ObjectId string)
export type AccessTokenPayload = { sub: string; role: Role; departmentId? : string; storeId : string };

// 3. EXPRESS REQUEST DECLARATION MERGING
// Open the global namespace scope to inject custom types into third-party libraries
declare global {
    namespace Express {
        // Merge a custom property into the existing Express Request interface
        interface Request {
            // Make 'user' an optional property so unauthenticated routes do not break
            user?: AccessTokenPayload;
        }
    }
}

// 4. AUTHENTICATION MIDDLEWARE
// Middleware function to intercept requests, read headers, and validate the user's identity token
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    // Read the incoming Authorization header from the client request
    const header = req.headers.authorization;

    // Guard Clause: If the header is missing or does not start with "Bearer ", reject instantly
    if (!header?.startsWith('Bearer ')) return next(AppError.unauthorized('Missing access token'));

    // Strip away the string "Bearer " to extract only the raw cryptographic token string
    const token = header.slice('Bearer '.length);
    
    try {
        // Verify the token signature using your secret key and cast the decoded object to our payload type
        req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
        // The token is valid! Move cleanly to the next middleware or route handler function
        next();
    } catch {
        // If jwt.verify throws an error (expired signature, tampered token, etc.), catch it and return a 401
        next(AppError.unauthorized('Invalid or expired access token'));
    }
};

// 5. ROLE-BASED AUTHORIZATION MIDDLEWARE (RBAC)
// A higher-order function (curried function) that accepts allowed roles and returns an Express middleware
export const requireRole = (...roles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        // Guard Clause: If 'authenticate' was not called before this, req.user will be empty. Reject it.
        if (!req.user) return next(AppError.unauthorized());
        
        // Check if the current user's role exists inside the array of allowed roles passed to the factory
        if (!roles.includes(req.user.role)) return next(AppError.forbidden());
        
        // The user possesses an allowed role! Proceed directly to the controller logic
        next();
    };
};
