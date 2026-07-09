import { Server as HttpServer } from "node:http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import type { AccessTokenPayload } from "../middleware/auth/auth.js"

// This module holds the single, shared Socket.io server instance for the whole app.
// It starts out undefined because the socket server doesn't exist until initSocket()
// is called (usually once, when the HTTP server starts up).
let io: SocketIOServer | undefined;

// initSocket wires up Socket.io on top of the existing HTTP server.
// We reuse the same HTTP server (instead of opening a new port) so the socket
// connections share the same host/port as the REST API.
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
    // Create the Socket.io server, attaching it to the Node http server passed in.
    io = new SocketIOServer(httpServer, {
        // CORS settings: only allow browser connections from our own frontend
        // (env.CLIENT_URL), and allow cookies/credentials to be sent, same as the REST API.
        cors: { origin: env.CLIENT_URL, credentials: true },
    });

    // io.use registers "middleware" that runs for every new socket connection
    // BEFORE it's accepted, similar to Express middleware for HTTP requests.
    // This is where we authenticate the socket.
    io.use((socket, next) => {
        // The client is expected to send the same JWT access token it uses for
        // REST API calls, but here it's passed via the socket handshake's "auth"
        // payload instead of an Authorization header (sockets don't have headers
        // the same way HTTP requests do). Reusing the same JWT means we don't need
        // a separate login system just for sockets - one token proves identity everywhere.
        const token = socket.handshake.auth?.token as string | undefined;
        // No token at all -> reject the connection immediately.
        if (!token) return next(new Error("Missing access token"));
        try {
            // Verify the token's signature and expiry using the same secret the
            // REST API uses. If valid, decode it into the user info it carries
            // (id, role, department, store) and stash it on socket.data.user so
            // later code (like the "connection" handler below) can read it.
            socket.data.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
            // Call next() with no error to let the connection proceed.
            next()
        } catch {
            // Token was invalid or expired -> reject the connection with an error.
            next(new Error("Invalid access token"))
        }
    });

    // "connection" fires once per socket that successfully passes the io.use()
    // middleware above (i.e. every socket here is already authenticated).
    io.on("connection", (socket: Socket) => {
        // Grab the decoded user info we saved during authentication.
        const user = socket.data.user as AccessTokenPayload;

        // "Rooms" are Socket.io's way of grouping sockets so you can broadcast
        // a message to a specific subset of connected clients instead of everyone.
        // Every socket automatically joins a room named after itself, but you can
        // also manually join sockets into extra rooms, which is what we do here.
        // By joining rooms based on identity (user id, role, department, store),
        // later code can emit an event to just "user:123" or "department:5"
        // and only the matching connected sockets will receive it - no need to
        // loop through all connected clients and filter manually.

        // Join a room unique to this specific user, e.g. "user:abc123".
        // Useful for sending events meant only for this one person (like "your ticket was updated").
        socket.join(`user:${user.sub}`);
        // Join a room shared by everyone with the same role, e.g. "role:ADMIN".
        // Useful for broadcasting to "all admins" regardless of who they are individually.
        socket.join(`role:${user.role}`);
        // Department is optional on the token, so only join this room if the user has one.
        // e.g. "department:5" - lets us notify everyone in a department at once.
        if (user.departmentId) socket.join(`department:${user.departmentId}`);
        // Same idea as department, but for the store the user belongs to, e.g. "store:9".
        if (user.storeId) socket.join(`store:${user.storeId}`)
    })

    // Return the created server in case the caller (e.g. the main server setup file)
    // wants to hold onto it directly too.
    return io;

}

// getIO lets other files (like ticketEvent.ts) access the already-created
// Socket.io server without having to pass it around as a parameter everywhere.
export const getIO = () : SocketIOServer => {
    // If someone calls this before initSocket() has run, there's nothing to
    // return, so we fail loudly instead of silently returning undefined.
    if(!io) throw new Error("Socket.io not initialized");
    return io;
}

