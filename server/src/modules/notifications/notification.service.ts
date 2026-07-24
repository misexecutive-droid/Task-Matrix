import { Notification } from '../../models/Notificaiton.js'; // the Mongoose model/collection for notifications (note: the filename itself has a typo, "Notificaiton" instead of "Notification" - just the file name, not something to fix here)
import { User } from '../../models/User.js'; // needed so we can look up department managers/HODs to notify them too
import { AppError } from '../../utils/AppError.js'; // helper for creating consistent HTTP error objects (e.g. 404 Not Found)
import { getIO } from '../../sockets/socket.js'; // gives us access to the Socket.IO server so we can push notifications to the browser in real time

// Shape of the data needed to create a single notification
type CreateNotificationInput = {
  recipientId: string; // who the notification is for
  type: string; // a short machine-readable category, e.g. "TICKET_ASSIGNED"
  title: string; // short headline shown in the UI
  message: string; // the full human-readable text
  ticketId?: string; // optional link back to the related ticket, if any
  taskId?: string; // optional link back to the related task, if any
};

// A ticket or task, reduced to just the fields the PC-verification notifications need.
type VerifiableEntity = {
  _id: any;
  title: string;
  departmentId?: any;
  storeId?: any;
  userId?: any;
  assigneeId?: any;
};

// Sends a notification to one specific user over their personal Socket.IO "room" (user:<id>),
// so if they have the app open, the notification appears instantly without needing to refresh.
const emitToUser = (userId: string, notification: unknown) => {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
};

// The notification service is the in-app notification system: it creates notification records in the
// database and also pushes them live over websockets so users see them immediately.
export const notificationService = {
  // Creates the SAME notification for multiple recipients at once (e.g. notify both the assignee and their manager).
  async notifyMany(recipientIds: string[], base: Omit<CreateNotificationInput, 'recipientId'>) {
    const uniqueIds = [...new Set(recipientIds)]; // de-duplicate ids, in case the same person would receive it twice (e.g. they're both the assignee and the manager)
    if (!uniqueIds.length) return []; // nothing to do if there's no one to notify

    // create one notification document per recipient, all sharing the same title/message/type/ticketId
    const docs = await Notification.insertMany(
      uniqueIds.map((recipientId) => ({ ...base, recipientId })),
    );
    // push each newly created notification to its owner in real time via websockets
    docs.forEach((doc) => emitToUser(doc.recipientId.toString(), doc));
    return docs;
  },

  // Called whenever a ticket gets assigned to someone - notifies the assignee AND that department's managers/HODs,
  // so both the person doing the work and the people overseeing the department know about it.
  async notifyTicketAssigned(ticket: { _id: any; title: string; departmentId?: any; assigneeId?: any }) {
    const recipientIds: string[] = []; // will collect everyone who should be notified about this assignment

    // if the ticket has an assignee, they should definitely be told they've been assigned something
    if (ticket.assigneeId) recipientIds.push(ticket.assigneeId.toString());

    // if the ticket belongs to a department, also notify that department's managers/HODs so they stay in the loop
    if (ticket.departmentId) {
      const heads = await User.find({ role: 'MANAGER', departmentId: ticket.departmentId }).select('_id');
      recipientIds.push(...heads.map((h) => h._id.toString()));
    }

    // send the same "ticket assigned" notification to everyone we collected above
    return notificationService.notifyMany(recipientIds, {
      type: 'TICKET_ASSIGNED',
      title: 'Ticket assigned',
      message: `Ticket "${ticket.title}" has been assigned.`,
      ticketId: ticket._id.toString(),
    });
  },

  // Called when a ticket/task is handed off for PC verification (ticket -> IN_REVIEW, task ->
  // pending_verification) - notifies every PC scoped to that department/store that something's
  // waiting on them. Mirrors notifyTicketAssigned's "look up the right people, notifyMany" shape.
  async notifyPendingVerification(entity: VerifiableEntity, kind: 'TICKET' | 'TASK' = 'TICKET') {
    const or: Record<string, unknown>[] = [];
    if (entity.departmentId) or.push({ departmentId: entity.departmentId });
    if (entity.storeId) or.push({ storeId: entity.storeId });
    if (!or.length) return []; // nothing to scope PCs by - no one to notify

    const pcs = await User.find({ role: 'PC', $or: or }).select('_id');
    const recipientIds = pcs.map((p) => p._id.toString());
    if (!recipientIds.length) return [];

    const idField = kind === 'TICKET' ? { ticketId: entity._id.toString() } : { taskId: entity._id.toString() };
    return notificationService.notifyMany(recipientIds, {
      type: `${kind}_PENDING_VERIFICATION`,
      title: kind === 'TICKET' ? 'Ticket awaiting verification' : 'Task awaiting verification',
      message: `"${entity.title}" is ready for your review.`,
      ...idField,
    });
  },

  // Called after a PC/Admin approves or rejects - tells the assignee (and the original raiser,
  // if different) the outcome, including the PC's note when there is one.
  async notifyVerificationResult(entity: VerifiableEntity, action: 'APPROVE' | 'REJECT', note: string | undefined, kind: 'TICKET' | 'TASK' = 'TICKET') {
    const recipientIds: string[] = [];
    if (entity.assigneeId) recipientIds.push(entity.assigneeId.toString());
    if (entity.userId && entity.userId.toString() !== entity.assigneeId?.toString()) recipientIds.push(entity.userId.toString());
    if (!recipientIds.length) return [];

    const idField = kind === 'TICKET' ? { ticketId: entity._id.toString() } : { taskId: entity._id.toString() };
    const verb = action === 'APPROVE' ? 'verified and closed' : 'sent back for changes';
    return notificationService.notifyMany(recipientIds, {
      type: `${kind}_${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`,
      title: action === 'APPROVE' ? 'Verified' : 'Sent back for changes',
      message: note ? `"${entity.title}" was ${verb}: ${note}` : `"${entity.title}" was ${verb}.`,
      ...idField,
    });
  },

  // Returns the most recent 50 notifications for a given user, newest first - used to populate the notifications dropdown/list in the UI
  async listForUser(userId: string) {
    return Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);
  },

  // Marks a single notification as read - but only if it actually belongs to this user
  // (the { _id: id, recipientId: userId } filter stops one user from marking someone else's notification as read)
  async markRead(id: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { isRead: true }, // flip the isRead flag on, so the UI stops showing it as "new"
      { new: true }, // return the updated document instead of the old one
    );
    if (!notification) throw AppError.notFound('Notification not found'); // nothing matched (wrong id, or not this user's notification) -> fail with a 404
    return notification;
  },

  // Marks EVERY unread notification belonging to this user as read in one bulk update -
  // this is what powers a "mark all as read" button, instead of the user clicking each one individually
  async markAllRead(userId: string) {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
  },
};