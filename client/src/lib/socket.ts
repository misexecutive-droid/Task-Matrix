import { io , type Socket } from "socket.io-client";

const BASE = ( import.meta.env.VITE_API_URL as string  | undefined)

let socket : Socket | null = null;
let refCount = 0

export const connectSocket = ( token : string) : Socket => {
    if (socket ) return socket;
    socket = io(BASE , { auth : { token }});
    refCount += 1;
    return socket;
};

export const releaseSocket = () => {
    refCount = Math.max(0, refCount - 1);
    if(refCount === 0){
        socket?.disconnect();
        socket = null;
    }
}

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
}