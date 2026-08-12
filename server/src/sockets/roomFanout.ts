import { getIO } from "./socket.js"

// Every field describes one way a connected client could care about the task/ticket this event
// is about — its creator, its assignee, its department, or (tickets only) its store. All
// optional/nullable since not every entity has every one of these set.
export type RoomTarget = {
    userId?: string | null;
    assigneeId?: string | null;
    departmentId?: string | null;
    storeId?: string | null;
};

// Works out the exact Socket.io rooms that should receive this event. A Set dedupes the case
// where, say, the creator and assignee are the same person, so "user:123" isn't emitted twice.
// Every event always reaches "role:ADMIN" so admins see everything regardless of who it belongs to.
const roomsFor = (target: RoomTarget): string[] => {
    const rooms = new Set<string>(["role:ADMIN"]);
    if (target.userId) rooms.add(`user:${target.userId}`);
    if (target.assigneeId) rooms.add(`user:${target.assigneeId}`);
    if (target.departmentId) rooms.add(`department:${target.departmentId}`);
    if (target.storeId) rooms.add(`store:${target.storeId}`);
    return [...rooms];
};

// Shared by emitTaskEvent and emitTicketEvent — the fan-out logic (which rooms, how many, how
// they're deduped) is identical for both; only the shape of what can target a room differs
// (tickets additionally carry a storeId).
export const emitRoomEvent = (event: string, target: RoomTarget, payload: unknown) => {
    const io = getIO();
    roomsFor(target).forEach((room) => io.to(room).emit(event, payload));
};
