import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MONGO_URI: z.string().min(1),
    MONGO_MAX_POOL_SIZE: z.coerce.number().default(50),
    CLIENT_URL: z.string().min(1),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    CLUSTER_WORKERS: z.coerce.number().optional(),

    CHECKLIST_TIMEZONE_OFFSET_MINUTES: z.coerce.number().default(330),

    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(30),

    COOKIE_SECURE: z.coerce.boolean().default(false),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

    AWS_REGION: z.string().default('us-east-1'),
    AWS_S3_BUCKET: z.string().default(''),
    AWS_ACCESS_KEY_ID: z.string().default(''),
    AWS_SECRET_ACCESS_KEY: z.string().default(''),

    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),
    MAIL_FROM: z.string().default(''),


    WHATSAPP_VERIFY_TOKEN: z.string().default(""),
    WHATSAPP_ACCESS_TOKEN: z.string().default(""),
    WHATSAPP_PHONE_NUMBER_ID: z.string().default(""),
    WHATSAPP_APP_SECRET: z.string().default(""),


    DOUBLETICK_API_KEY: z.string().default(""),
    DOUBLETICK_WEBHOOK_SECRET: z.string().default(""),
    DOUBLETICK_SENDER_NUMBER: z.string().default(""),


});

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('Invalid enviroment variables : ', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid enviroment variables')
}

export const env = parsed.data;
