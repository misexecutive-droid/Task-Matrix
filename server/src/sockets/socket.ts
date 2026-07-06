import { Server as HttpServer } from "node:http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import type { AccessTokenPayload } from "../middleware/auth/auth.js"

let io: SocketIOServer | undefined;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: { origin: env.CLIENT_URL, credentials: true },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error("Missing access token"));
        try {
            socket.data.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as Access; TokenPayload;
            next()
        } catch {
            next(new Error("Invalid access token"))
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user as AccessTokenPayload;
        socket.join(`user:${user.sub}`);
        socket.join(`role : ${user.role}`);
        if (user.departmentId) socket.join(`department:${user.departmentId}`);
        if (user.storeId) socket.join(`store:${user.storeId}`)
    })

    return io;

}

export const getIO = () : SocketIOServer => {
    if(!io) throw new Error("Socket.io not initialized");
    return io;
}
  
