import { io , type Socket } from "socket.io-client";

const BASE = ( import.meta.env.VITE_API_URL as string  | undefined)

let socket : Socket | null = null;

export const connectSocket = ( token : string) : Socket => {
    if (socket ) return socket;
    socket = io(BASE , { auth : { token }});
    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
}