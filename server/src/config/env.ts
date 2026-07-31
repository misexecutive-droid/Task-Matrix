import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    PORT : z.coerce.number().default(3000),
    NODE_ENV : z.enum(['development', 'test' , 'production']).default('development'),
    MONGO_URI : z.string().min(1),
    MONGO_MAX_POOL_SIZE : z.coerce.number().default(50),
    CLIENT_URL: z.string().min(1),
    REDIS_URL : z.string().default("redis://localhost:6379"),
    CLUSTER_WORKERS : z.coerce.number().optional(),

    // Minutes ahead of UTC for the org's local calendar day (default 330 = IST, UTC+5:30). Used
    // only by the checklist recurrence engine so "due today" matches the admin's local date
    // instead of the server's UTC date.
    CHECKLIST_TIMEZONE_OFFSET_MINUTES : z.coerce.number().default(330),

    JWT_ACCESS_SECRET : z.string().min(10),
    JWT_ACCESS_EXPIRES_IN : z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN_DAYS : z.coerce.number().default(30),

    COOKIE_SECURE : z.coerce.boolean().default(false),
    COOKIE_SAMESITE : z.enum(['lax' , 'strict' , 'none']).default('lax'),

    AWS_REGION: z.string().default('us-east-1'),
    AWS_S3_BUCKET : z.string().default(''),
    AWS_ACCESS_KEY_ID : z.string().default(''),
    AWS_SECRET_ACCESS_KEY : z.string().default(''),

    SMTP_HOST : z.string().default(''),
    SMTP_PORT : z.coerce.number().default(587),
    SMTP_USER : z.string().default(''),
    SMTP_PASS : z.string().default(''),
    MAIL_FROM : z.string().default(''),

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
