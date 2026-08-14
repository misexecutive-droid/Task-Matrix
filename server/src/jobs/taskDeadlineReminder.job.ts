import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { notificationService } from '../modules/notifications/notification.service.js';
import { sendMail } from '../config/mailer.js';

// Mirrors slaSweep.job.ts's shape: a recurring background sweep, since nothing else would ever
// check "is it time to remind someone about this deadline" — nobody has to be looking at the
// task for the reminder to fire.
export const startTaskDeadlineReminder = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // Only tasks that asked for a reminder, haven't already gotten one, and aren't already
      // finished (a done task has nothing left to be reminded about).
      const candidates = await Task.find({
        dueDate: { $ne: null },
        reminderMinutesBefore: { $ne: null },
        reminderSentAt: null,
        status: { $ne: 'done' },
      });

      const due = candidates.filter((task: any) => {
        const fireAt = new Date(task.dueDate.getTime() - task.reminderMinutesBefore * 60_000);
        return fireAt <= now;
      });

      if (!due.length) return;

      for (const task of due as any[]) {
        const recipientIds: string[] = [];
        if (task.assigneeId) recipientIds.push(task.assigneeId.toString());
        recipientIds.push(...(task.additionalAssigneeIds ?? []).map((a: any) => a.toString()));
        if (task.userId && task.userId.toString() !== task.assigneeId?.toString()) {
            recipientIds.push(task.userId.toString());
        }
        if (!recipientIds.length) continue;

        const uniqueRecipientIds = [...new Set(recipientIds)];
        const channel = task.reminderChannel ?? 'notification';
        const title = 'Task deadline approaching';
        const message = `"${task.title}" is due ${task.dueDate.toLocaleString()}.`;

        if (channel === 'email') {
          const recipients = await User.find({ _id: { $in: uniqueRecipientIds } }).select('email firstName');
          await Promise.all(
            recipients.map((r: any) =>
              sendMail({ to: r.email, subject: title, html: `<p>Hi ${r.firstName},</p><p>${message}</p>` })
                .catch((err) => console.error(`Task deadline reminder: email to ${r.email} failed:`, err)),
            ),
          );
        } else if (channel === 'sms') {
          // No SMS gateway is configured in this app (no Twilio/MSG91 keys in env.ts) — fall back
          // to the in-app notification below rather than silently dropping the reminder.
          console.warn(`Task deadline reminder: SMS channel requested for task ${task._id} but no SMS provider is configured — falling back to in-app notification.`);
        }

        // 'notification' and 'alarm' both surface in-app/over-socket; 'alarm' gets a distinct type
        // so the client can eventually give it a louder treatment (sound/persistent modal). Email
        // and the sms-fallback case also get this so there's always a record in the notification
        // center even when the other channel succeeds or isn't configured.
        await notificationService.notifyMany(uniqueRecipientIds, {
          type: channel === 'alarm' ? 'TASK_DEADLINE_ALARM' : 'TASK_DEADLINE_REMINDER',
          title,
          message,
          taskId: task._id.toString(),
        });
      }

      await Task.updateMany(
        { _id: { $in: due.map((task: any) => task._id) } },
        { reminderSentAt: now },
      );

      console.log(`Task deadline reminder: notified for ${due.length} task(s)`);
    } catch (err) {
      console.error('Task deadline reminder sweep failed:', err);
    }
  });
};
