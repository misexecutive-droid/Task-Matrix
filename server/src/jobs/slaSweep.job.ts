// node-cron lets us run a function automatically on a repeating schedule,
// kind of like a built-in alarm clock for our server code.
import cron from 'node-cron';
// The Ticket model is how we talk to the "tickets" collection in MongoDB
// (find tickets, update them, save changes, etc.).
import { Ticket } from '../models/Ticket.js';
// A helper that broadcasts real-time events (over sockets) to connected
// clients, so the frontend can update instantly without refreshing.
import { emitTicketEvent } from '../sockets/ticketEvent.js';



// startSlaSweep sets up (but does not immediately run) a recurring background
// job. "SLA" here means "Service Level Agreement" - basically a promise that
// a ticket will be handled by a certain deadline (tatDueAt = "Turn-Around-Time
// Due At"). This function just registers the schedule; call it once when the
// server starts up.
export const startSlaSweep = () => {
  // cron.schedule takes a "cron expression" (a 5-part time pattern) and a
  // callback to run each time that pattern matches. The pattern here is
  // '*/5 * * * *', which in plain English means: "every 5 minutes, every
  // hour, every day, every month, every day of the week" - i.e. this job
  // wakes up and runs once every 5 minutes, forever, for as long as the
  // server process is alive.
  cron.schedule('*/5 * * * *', async () => {
    // Every time the cron job fires, look in the database for tickets that
    // have "gone overdue" since we last checked. We can't just check this
    // when someone loads a ticket, because if nobody looks at a ticket, it
    // would never get flagged as overdue - and nobody would get notified.
    // Running this sweep in the background guarantees overdue tickets get
    // caught (and their assignees notified) even if no one is actively
    // viewing them.
    const overdue = await Ticket.find({
      // tatDueAt is the deadline timestamp; $lt means "less than", so this
      // matches tickets whose deadline is earlier than right now (i.e. the
      // deadline has already passed).
      tatDueAt: { $lt: new Date() },
      // Only grab tickets we haven't already flagged as overdue, so we don't
      // redo work or spam extra notifications for the same ticket every 5
      // minutes.
      isOverdue: false,
      // $ne means "not equal" - skip tickets that are already CLOSED, since
      // a closed ticket doesn't need to be marked overdue anymore.
      status: { $ne: 'CLOSED' },
    });

    // Loop through every ticket that just became overdue and update it one
    // at a time.
    for (const ticket of overdue) {
      // Flag this ticket in memory as overdue...
      ticket.isOverdue = true;
      // ...then persist that change back to the database.
      await ticket.save();

      // Tell any connected clients (via websockets) that this ticket just
      // became overdue, so the UI can update live and/or show a
      // notification. We pass along the relevant user/assignee/department/
      // store IDs so the event can be routed to the right people.
      emitTicketEvent('ticket:overdue', {
        userId:       ticket.userId?.toString(),
        // Optional chaining (?.) plus ?? null: if there's no assignee, don't
        // crash - just send null instead of an id.
        assigneeId:   ticket.assigneeId?.toString() ?? null,
        departmentId: ticket.departmentId?.toString() ?? null,
        storeId:      ticket.storeId?.toString() ?? null,
      }, { id: ticket._id.toString(), tatDueAt: ticket.tatDueAt });
    }

    // If we actually flagged at least one ticket this run, log it to the
    // server console so it's easy to see the sweep doing its job while
    // watching logs. If overdue.length is 0 we stay quiet to avoid noisy
    // logs every 5 minutes.
    if (overdue.length) {
      console.log(`SLA sweep: flagged ${overdue.length} ticket(s) as overdue`);
    }
  });
};
