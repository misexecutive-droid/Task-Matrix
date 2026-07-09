// Loading this module automatically reads the ".env" file in the project and copies its values into process.env,
// so that things like process.env.MONGO_URI become available. This must run before we try to read process.env below.
import 'dotenv/config'
// Zod is a schema-validation library — it lets us describe what "shape" our environment variables should have,
// and will validate/convert them for us (e.g. turning the string "3000" into the number 3000).
import { z } from 'zod'

// Define the expected shape of our environment variables, including types, validation rules, and default values.
const envSchema = z.object({
    // PORT must be coercible to a number (env vars are always strings, so z.coerce.number() converts "3000" -> 3000).
    // Defaults to 3000 if not provided.
    PORT : z.coerce.number().default(3000),
    // NODE_ENV must be one of these three specific strings; defaults to 'development' if not set.
    NODE_ENV : z.enum(['development', 'test' , 'production']).default('development'),
    // MONGO_URI (MongoDB connection string) is required — must be a string with at least 1 character (i.e. not empty).
    MONGO_URI : z.string().min(1),
    // The URL of our frontend client app (used for CORS) — also required.
    CLIENT_URL: z.string().min(1),

    // Secret key used to sign/verify short-lived JWT access tokens (used for authentication). Must be at least 10 characters.
    JWT_ACCESS_SECRET : z.string().min(10),
    // How long an access token stays valid before it expires, e.g. "15m" for 15 minutes. Defaults to '15m'.
    JWT_ACCESS_EXPIRES_IN : z.string().default('15m'),
    // How many days a refresh token (used to get new access tokens without re-logging-in) stays valid. Defaults to 30 days.
    JWT_REFRESH_EXPIRES_IN_DAYS : z.coerce.number().default(30),

    // Whether cookies should only be sent over HTTPS ("secure" cookies). Defaults to false (useful for local http development).
    COOKIE_SECURE : z.coerce.boolean().default(false),
    // Controls the cookie's "SameSite" attribute, which affects whether cookies are sent on cross-site requests. Defaults to 'lax'.
    COOKIE_SAMESITE : z.enum(['lax' , 'strict' , 'none']).default('lax'),

    // AWS region used for any AWS services (like S3 file storage). Defaults to 'us-east-1'.
    AWS_REGION: z.string().default('us-east-1'),
    // Name of the S3 bucket used for file storage, if any. Defaults to an empty string (i.e. optional/not configured).
    AWS_S3_BUCKET : z.string().default(''),
    // AWS access key ID for authenticating with AWS. Defaults to an empty string (optional/not configured).
    AWS_ACCESS_KEY_ID : z.string().default(''),
    // AWS secret access key for authenticating with AWS. Defaults to an empty string (optional/not configured).
    AWS_SECRET_ACCESS_KEY : z.string().default('')



});

// Try to validate process.env against our schema. safeParse (instead of parse) returns a result object
// instead of throwing, so we can handle validation failures ourselves below.
const parsed = envSchema.safeParse(process.env)

    // If validation failed (e.g. a required variable is missing or the wrong type)...
    if(!parsed.success){
        // Log a readable summary of which fields failed and why — helps whoever is running the app fix their .env file.
        console.error('Invalid enviroment variables : ' , parsed.error.flatten().fieldErrors);
        // Stop the app immediately — there's no safe way to run without valid config (e.g. a missing DB connection string).
        throw new Error ('Invalid enviroment variables')
    }

// Export the validated (and type-safe!) environment variables for the rest of the app to import and use,
// e.g. `env.PORT` will actually be a number, not a string, thanks to the schema above.
export const env = parsed.data;
