import { Notification } from '../../models/Notificaiton.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { getIO } from '../../sockets/socket.js';

type CreateNotificationInput = {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  ticketId?: string;
};

const emitToUser = (userId: string, notification: unknown) => {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
};

export const notificationService = {
  async notifyMany(recipientIds: string[], base: Omit<CreateNotificationInput, 'recipientId'>) {
    const uniqueIds = [...new Set(recipientIds)];
    if (!uniqueIds.length) return [];

    const docs = await Notification.insertMany(
      uniqueIds.map((recipientId) => ({ ...base, recipientId })),
    );
    docs.forEach((doc) => emitToUser(doc.recipientId.toString(), doc));
    return docs;
  },

  async notifyTicketAssigned(ticket: { _id: any; title: string; departmentId?: any; assigneeId?: any }) {
    const recipientIds: string[] = [];

    if (ticket.assigneeId) recipientIds.push(ticket.assigneeId.toString());

    if (ticket.departmentId) {
      const heads = await User.find({ role: 'MANAGER', departmentId: ticket.departmentId }).select('_id');
      recipientIds.push(...heads.map((h) => h._id.toString()));
    }

    return notificationService.notifyMany(recipientIds, {
      type: 'TICKET_ASSIGNED',
      title: 'Ticket assigned',
      message: `Ticket "${ticket.title}" has been assigned.`,
      ticketId: ticket._id.toString(),
    });
  },

  async listForUser(userId: string) {
    return Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);
  },

  async markRead(id: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { isRead: true },
      { new: true },
    );
    if (!notification) throw AppError.notFound('Notification not found');
    return notification;
  },

  async markAllRead(userId: string) {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
  },
};
