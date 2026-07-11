import path from "node:path"
import fs from "node:fs"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { TaskImage } from "../../models/TaskImage.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"

// Same rule as completing an item — only the assignee (or an admin) can add evidence photos.
const assertCanUpload = (user: AccessTokenPayload, item: any) => {
    if (user.role === "ADMIN") return;
    if (item.assigneeId && String(item.assigneeId) === user.sub) return;
    throw AppError.forbidden("Only the assigned person can upload evidence for this item");
};

export const taskImageService = {
    async upload(itemId: string, files: Express.Multer.File[], captureMethod: "LIVE" | "GALLERY", user: AccessTokenPayload) {
        const item = await TaskChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        assertCanUpload(user, item);

        if (!files.length) {
            // Multer's fileFilter (config/upload.ts) silently drops non-image files instead of
            // erroring — this is where that shows up: if everything got filtered out, files
            // will be empty even though the request technically "succeeded" at the multer layer.
            throw AppError.badRequest("No valid image files were received (check file type and size)");
        }

        // If this item mandates a live photo, reject a gallery upload outright instead of
        // silently storing files that would never count toward completion anyway (see
        // taskChecklist.service.ts's completeItem, which filters these out at completion time).
        if (item.requiresLivePhoto && captureMethod !== "LIVE") {
            // Clean up what multer already wrote to disk before we knew to reject it — otherwise
            // these become orphaned files nothing ever references or deletes.
            files.forEach((f) => fs.unlink(f.path, () => {}));
            throw AppError.badRequest("This item requires a live camera photo, not a gallery upload");
        }

        return TaskImage.insertMany(
            files.map((file) => ({
                url: `/uploads/tasks/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                captureMethod,
                taskChecklistItemId: item._id,
                uploadedBy: user.sub,
            })),
        );
    },

    async remove(imageId: string, user: AccessTokenPayload) {
        const image = await TaskImage.findById(imageId);
        if (!image) throw AppError.notFound("Image not found");

        const item = await TaskChecklistItem.findById(image.taskChecklistItemId);
        if (item) assertCanUpload(user, item);

        // Delete the real file from disk. If this fails (e.g. it was already gone), we log it
        // but still proceed to clean up the database record — a stray file on disk is a much
        // smaller problem than a database record permanently pointing at nothing.
        const absolutePath = path.resolve(process.cwd(), "uploads", "tasks", path.basename(image.url));
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete image file from disk:", err);
        });

        await image.deleteOne();
        return image;
    },
};
