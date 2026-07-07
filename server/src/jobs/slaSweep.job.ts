import cron from 'node-cron';
import { Ticket } from '../models/Ticket.js';
import { emitTicketEvent } from '../sockets/ticketEvent.js';



export const startSlaSweep = () => {
  cron.schedule('*/5 * * * *', async () => {
    const overdue = await Ticket.find({
      tatDueAt: { $lt: new Date() },
      isOverdue: false,
      status: { $ne: 'CLOSED' },
    });

    for (const ticket of overdue) {
      ticket.isOverdue = true;
      await ticket.save();

      emitTicketEvent('ticket:overdue', {
        userId:       ticket.userId?.toString(),
        assigneeId:   ticket.assigneeId?.toString() ?? null,
        departmentId: ticket.departmentId?.toString() ?? null,
        storeId:      ticket.storeId?.toString() ?? null,
      }, { id: ticket._id.toString(), tatDueAt: ticket.tatDueAt });
    }

    if (overdue.length) {
      console.log(`SLA sweep: flagged ${overdue.length} ticket(s) as overdue`);
    }
  });
};
