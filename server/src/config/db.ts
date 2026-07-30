import mongoose from 'mongoose'
import { env } from './env.js'


export const connectDB = async () => {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI, {
        maxPoolSize: env.MONGO_MAX_POOL_SIZE,
        minPoolSize: Math.min(5, env.MONGO_MAX_POOL_SIZE),
    });

    console.log(`MongoDB connected : ${mongoose.connection.name}`)
}

export const disconnectDB = async () => {
    await mongoose.disconnect();
}
