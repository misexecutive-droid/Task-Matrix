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
    // Wrapped in try/catch because this callback runs unattended on a timer -
    // nobody is watching a request/response to surface a thrown error, so
    // without this the whole sweep would silently die (or crash the process
    // via an unhandled rejection) the moment a single DB call hiccups.
    try {
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

      if (!overdue.length) return;

      // Flag every overdue ticket as overdue in a single bulk update instead
      // of one save() per ticket - one round-trip to the database no matter
      // how many tickets went overdue this sweep, instead of N.
      await Ticket.updateMany(
        { _id: { $in: overdue.map((ticket) => ticket._id) } },
        { isOverdue: true },
      );

      // Still loop per-ticket here, but only to emit each one's socket event -
      // that has to happen individually since each ticket routes to a
      // different set of rooms (its own user/assignee/department/store).
      for (const ticket of overdue) {
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

      console.log(`SLA sweep: flagged ${overdue.length} ticket(s) as overdue`);
    } catch (err) {
      console.error('SLA sweep failed:', err);
    }
  });
};
