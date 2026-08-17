import path from "node:path";
import fs from "node:fs";
import { Task } from "../../models/Task.js";
import { TaskAttachment } from "../../models/TaskAttachment.js";
import { AppError } from "../../utils/AppError.js";
import type { AccessTokenPayload } from "../../middleware/auth/auth.js";

// Who can attach/remove files directly on a task — the creator, the assignee, or an Admin.
// Looser than checklist-item evidence (assignee-only there) since this is general reference
// material/evidence on the task itself, not one person's specific work item.
const assertCanAttach = (user: AccessTokenPayload, task: any) => {
    if (user.role === "ADMIN" || user.role === "PC") return;
    if (String(task.userId) === user.sub) return;
    if (task.assigneeId && String(task.assigneeId) === user.sub) return;
    if ((task.additionalAssigneeIds ?? []).some((id: any) => String(id) === user.sub)) return;
    throw AppError.forbidden("You don't have access to this task's attachments");
};

export const taskAttachmentService = {
    async upload(taskId: string, files: Express.Multer.File[], user: AccessTokenPayload) {
        const task = await Task.findById(taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanAttach(user, task);

        if (!files.length) {
            throw AppError.badRequest("No valid files were received (check file type and size)");
        }

        return TaskAttachment.insertMany(
            files.map((file) => ({
                url: `/uploads/task-attachments/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                taskId: task._id,
                uploadedBy: user.sub,
            })),
        );
    },

    async remove(attachmentId: string, user: AccessTokenPayload) {
        const attachment = await TaskAttachment.findById(attachmentId);
        if (!attachment) throw AppError.notFound("Attachment not found");

        const task = await Task.findById(attachment.taskId);
        if (task) assertCanAttach(user, task);

        const absolutePath = path.resolve(process.cwd(), "uploads", "task-attachments", path.basename(attachment.url));
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete task attachment file from disk:", err);
        });

        await attachment.deleteOne();
        return attachment;
    },
};
