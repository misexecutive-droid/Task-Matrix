import { getIO } from "./socket.js"

// This describes the pieces of information about a ticket that determine
// WHO should be notified about it. Not every ticket has all of these - for
// example a ticket might not have an assignee yet - so they're all optional
// (marked with "?") and can be null.
type TicketRoomTarget = {
    userId?: string | null;       // the user who created/owns the ticket
    assigneeId?: string | null;   // the user (if any) currently assigned to work on the ticket
    departmentId?: string | null; // the department the ticket belongs to
    storeId?: string | null       // the store the ticket belongs to
};

// roomsFor figures out the exact list of Socket.io "rooms" that should
// receive a notification about a given ticket, based on who is connected
// to that ticket (creator, assignee, department, store).
const roomsFor = ( target : TicketRoomTarget) : string[] => {

    // We use a Set (instead of an array) so that if the same room name would
    // be added twice (e.g. the ticket creator and assignee are the same
    // person, so "user:123" would be computed twice) it only appears once.
    // Every ticket event always goes to "role:ADMIN" so admins can see/manage
    // all tickets regardless of who they belong to.
    const rooms = new Set<string>(["role:ADMIN"]);
    // If the ticket has a creator/owner, notify that specific user's room.
    if(target.userId)       rooms.add(`user:${target.userId}`);
    // If the ticket has an assignee, notify that specific user's room too.
    // (This is a separate "user:<id>" room, reusing the same naming scheme
    // that socket.ts uses when a user connects, so it lines up correctly.)
    if(target.assigneeId)   rooms.add(`user:${target.assigneeId}`);
    // If the ticket belongs to a department, notify everyone currently
    // connected from that department (e.g. so department staff see new tickets).
    if(target.departmentId) rooms.add(`department:${target.departmentId}`)
    // Same idea, but for the store the ticket belongs to.
    if(target.storeId)      rooms.add(`store:${target.storeId}`)

   // Convert the Set back into a plain array of room names, since that's what
   // io.to() (used below) and the rest of the app expect to work with.
   return [...rooms]

}

// emitTicketEvent is the function the rest of the app calls whenever
// something happens to a ticket (created, updated, assigned, etc.) and
// connected clients need to be told about it in real time.
export const emitTicketEvent = (event : string , target : TicketRoomTarget , payload : unknown) => {
    // Get the already-initialized Socket.io server (set up once in socket.ts).
    const io = getIO();
    // Work out which rooms care about this ticket, then emit the event to
    // each one. io.to(room).emit(...) sends the event only to sockets that
    // joined that room - so, for example, a ticket in "store:9" only reaches
    // people connected from store 9, plus the specific user/assignee rooms
    // and all admins, instead of broadcasting to every connected client.
    roomsFor(target).forEach((room) => io.to(room).emit(event , payload))
}
