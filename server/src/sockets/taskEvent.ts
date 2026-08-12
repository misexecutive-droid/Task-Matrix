import { emitRoomEvent, type RoomTarget } from "./roomFanout.js"

type TaskRoomTarget = Pick<RoomTarget, "userId" | "assigneeId" | "departmentId">

export const emitTaskEvent = (event: string, target: TaskRoomTarget, payload: unknown) =>
    emitRoomEvent(event, target, payload)
