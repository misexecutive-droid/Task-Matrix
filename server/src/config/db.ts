// Mongoose is a library that makes it easier to work with MongoDB from Node.js —
// it lets us define schemas/models and handles the underlying database connection for us.
import mongoose from 'mongoose'
// Our validated environment variables, specifically MONGO_URI (the database connection string).
import { env } from './env.js'


// Opens the connection to MongoDB. This is called once when the server starts up (see server.ts).
export const connectDB = async () => {
    // "strictQuery" controls how Mongoose builds queries with fields not defined in your schema.
    // Setting it to true means Mongoose will filter out unknown fields in queries, which avoids some subtle bugs.
    mongoose.set('strictQuery' , true);
    // Actually connect to MongoDB using the connection string from our environment variables.
    // "await" pauses here until the connection succeeds (or throws an error if it fails).
    await mongoose.connect(env.MONGO_URI);
    // Log the name of the database we successfully connected to, as a sanity check.
    console.log(`MongoDB connected : ${mongoose.connection.name}`)
}

// Closes the connection to MongoDB. Used during graceful shutdown (see server.ts's shutdown() method)
// so the app doesn't leave a dangling database connection open when it exits.
export const disconnectDB = async () => {
    await mongoose.disconnect();
}
