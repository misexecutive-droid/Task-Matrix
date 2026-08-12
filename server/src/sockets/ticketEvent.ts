import { emitRoomEvent, type RoomTarget } from "./roomFanout.js"

type TicketRoomTarget = RoomTarget

export const emitTicketEvent = (event: string, target: TicketRoomTarget, payload: unknown) =>
    emitRoomEvent(event, target, payload)
