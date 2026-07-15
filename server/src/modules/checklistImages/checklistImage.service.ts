import path from "node:path";
import fs from "node:fs";
import { ChecklistItem } from "../../models/ChecklistItem.js";
import { ChecklistImage } from "../../models/ChecklistImage.js";
import { AppError } from "../../utils/AppError.js";
import type { AccessTokenPayload } from "../../middleware/auth/auth.js";

// Same rule as the Task side — only the assignee (or an admin) can add evidence photos.
const assertCanUpload = (user: AccessTokenPayload, item: any) => {
    if (user.role === "ADMIN") return;
    if (item.assigneeId && String(item.assigneeId) === user.sub) return;
    throw AppError.forbidden("Only the assigned person can upload evidence for this item");
};

export const checklistImageService = {
    async upload(itemId: string, files: Express.Multer.File[], captureMethod: "LIVE" | "GALLERY", user: AccessTokenPayload) {
        const item = await ChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        assertCanUpload(user, item);

        if (!files.length) {
            throw AppError.badRequest("No valid image files were received (check file type and size)");
        }

        if (item.requiresLivePhoto && captureMethod !== "LIVE") {
            files.forEach((f) => fs.unlink(f.path, () => {}));
            throw AppError.badRequest("This item requires a live camera photo, not a gallery upload");
        }

        // maxImageCount: an upper cap on how much evidence can pile up on one item — distinct
        // from requiredImageCount (the minimum needed to complete it). null means no cap.
        if (item.maxImageCount != null) {
            const existingCount = await ChecklistImage.countDocuments({ checklistItemId: item._id });
            if (existingCount + files.length > item.maxImageCount) {
                files.forEach((f) => fs.unlink(f.path, () => {}));
                const remaining = Math.max(item.maxImageCount - existingCount, 0);
                throw AppError.badRequest(
                    remaining > 0
                        ? `This item allows at most ${item.maxImageCount} photo(s) — only ${remaining} more can be uploaded`
                        : `This item already has the maximum of ${item.maxImageCount} photo(s)`,
                );
            }
        }

        return ChecklistImage.insertMany(
            files.map((file) => ({
                url: `/uploads/tickets/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                captureMethod,
                checklistItemId: item._id,
                uploadedBy: user.sub,
            })),
        );
    },

    async remove(imageId: string, user: AccessTokenPayload) {
        const image = await ChecklistImage.findById(imageId);
        if (!image) throw AppError.notFound("Image not found");

        const item = await ChecklistItem.findById(image.checklistItemId);
        if (item) assertCanUpload(user, item);

        const absolutePath = path.resolve(process.cwd(), "uploads", "tickets", path.basename(image.url));
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete image file from disk:", err);
        });

        await image.deleteOne();
        return image;
    },
};