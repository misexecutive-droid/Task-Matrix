import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    PORT : z.coerce.number().default(3000),
    NODE_ENV : z.enum(['development', 'test' , 'production']).default('development'),
    MONGO_URI : z.string().min(1),
    CLIENT_URL: z.string().min(1),

    JWT_ACCESS_SECRET : z.string().min(10),
    JWT_ACCESS_EXPIRES_IN : z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN_DAYS : z.coerce.number().default(30),

    COOKIE_SECURE : z.coerce.boolean().default(false),
    COOKIE_SAMESITE : z.enum(['lax' , 'strict' , 'none']).default('lax'),

    AWS_REGION: z.string().default('us-east-1'),
    AWS_S3_BUCKET : z.string().default(''),
    AWS_SECRET_ACCESS_KEY : z.string().default(''),
    AWS_SECRET_ACCESS_KEY : z.string().default('')

    

});

const parsed = envSchema.safeParse(process.env)

    if(!parsed.success){
        console.error('Invalid enviroment variables : ' , parsed.error.flatten().fieldErrors);
        throw new Error ('Invalid enviroment variables')
    }

export const env = parsed.data;
