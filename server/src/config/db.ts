import mongoose from 'mongoose'
import { env } from './env.js'


export const connectDB = async () => {
    mongoose.set('strictQuery' , true);
    await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected : ${mongoose.connection.name}`)
}

export const disconnectDB = async () => {
    await mongoose.disconnect();
}