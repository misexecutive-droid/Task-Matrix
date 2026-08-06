import { getIO } from "./socket.js"

type TaskRoomTarget = {
    userId?: string | null;
    assigneeId?: string | null;
    departmentId?: string | null;
};

const roomsFor = (target: TaskRoomTarget): string[] => {
    const rooms = new Set<string>(["role:ADMIN"]);
    if (target.userId) rooms.add(`user:${target.userId}`);
    if (target.assigneeId) rooms.add(`user:${target.assigneeId}`);
    if (target.departmentId) rooms.add(`department:${target.departmentId}`);
    return [...rooms];
};

export const emitTaskEvent = (event: string, target: TaskRoomTarget, payload: unknown) => {
    const io = getIO();
    roomsFor(target).forEach((room) => io.to(room).emit(event, payload));
};
