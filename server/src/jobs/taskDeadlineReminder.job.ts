import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { notificationService } from '../modules/notifications/notification.service.js';

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

        await notificationService.notifyMany(recipientIds, {
          type: 'TASK_DEADLINE_REMINDER',
          title: 'Task deadline approaching',
          message: `"${task.title}" is due ${task.dueDate.toLocaleString()}.`,
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
