import { getIO } from "./socket.js"

type TicketRoomTarget = {
    userId?: string | null;
    assigneeId?: string | null;
    departmentId?: string | null;
    storeId?: string | null
};

const roomsFor = ( target : TicketRoomTarget) : string[] => {

    const rooms = new Set<string>(["role:ADMIN"]);
    if(target.userId)       rooms.add(`user:${target.userId}`);
    if(target.assigneeId)   rooms.add(`user:${target.assigneeId}`);
    if(target.departmentId) rooms.add(`department:${target.departmentId}`)
    if(target.storeId)      rooms.add(`store:${target.storeId}`)

   return [...rooms]

}

export const emitTicketEvent = (event : string , target : TicketRoomTarget , payload : unknown) => {
    const io = getIO();
    roomsFor(target).forEach((room) => io.to(room).emit(event , payload))
}