import path from "node:path"
import { Task } from "../../models/Task.js"
import { TaskComment } from "../../models/TaskComment.js"
import { TaskAttachment } from "../../models/TaskAttachment.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskCommentInput } from "./taskComment.validation.js"

// Who can view/post to a task's activity feed — same circle as task attachments (creator,
// assignee, or Admin): general collaboration context, not gated to one specific role.
const assertCanComment = (user: AccessTokenPayload, task: any) => {
    if (user.role === "ADMIN") return;
    if (String(task.userId) === user.sub) return;
    if (task.assigneeId && String(task.assigneeId) === user.sub) return;
    if ((task.additionalAssigneeIds ?? []).some((id: any) => String(id) === user.sub)) return;
    throw AppError.forbidden("You don't have access to this task's activity");
};

const AUTHOR_FIELDS = "firstName lastName email role";

export const taskCommentService = {
    async list(taskId: string, user: AccessTokenPayload) {
        const task = await Task.findById(taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanComment(user, task);

        return TaskComment.find({ taskId })
            .sort({ createdAt: 1 })
            .populate("authorId", AUTHOR_FIELDS);
    },

    async create(taskId: string, input: CreateTaskCommentInput, files: Express.Multer.File[], user: AccessTokenPayload) {
        const task = await Task.findById(taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanComment(user, task);

        const attachments = files.map((file) => ({
            url: `/uploads/task-comment-attachments/${path.basename(file.path)}`,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
        }));

        if (!input.body?.trim() && !attachments.length && !input.location) {
            throw AppError.badRequest("A comment needs text, an attachment, or a location.");
        }

        const comment = await TaskComment.create({
            taskId: task._id,
            authorId: user.sub,
            body: input.body?.trim() ?? "",
            attachments,
            location: input.location ?? null,
        });

        // Mirror any files into the task's top-level attachment pool too — TaskCard/TaskRow's
        // Kanban/list cover-photo thumbnail reads Task.attachments, not comment attachments, so
        // without this a file shared in a comment would never surface anywhere but the thread.
        if (attachments.length) {
            await TaskAttachment.insertMany(
                attachments.map((a) => ({ ...a, taskId: task._id, uploadedBy: user.sub })),
            );
        }

        return comment.populate("authorId", AUTHOR_FIELDS);
    },
};
