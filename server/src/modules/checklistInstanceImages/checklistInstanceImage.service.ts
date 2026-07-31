import path from "node:path";
import fs from "node:fs";
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js";
import { ChecklistInstance } from "../../models/ChecklistInstance.js";
import { ChecklistInstanceImage } from "../../models/ChecklistInstanceImage.js";
import { AppError } from "../../utils/AppError.js";
import type { AccessTokenPayload } from "../../middleware/auth/auth.js";

// A recurring checklist instance has no per-item assignee (see ChecklistDefinitionItem.ts) — so
// unlike the Ticket/Task side, "can upload" is checked against the whole instance's assigneeIds,
// not a single item.assigneeId.
const assertCanUpload = async (user: AccessTokenPayload, item: any) => {
    if (user.role === "ADMIN") return;
    const instance = await ChecklistInstance.findById(item.instanceId);
    if (!instance) throw AppError.notFound("Checklist instance not found");
    if (instance.assigneeIds.some((id: any) => id.toString() === user.sub)) return;
    throw AppError.forbidden("Only an assignee of this checklist can upload evidence for it");
};

export const checklistInstanceImageService = {
    async upload(itemId: string, files: Express.Multer.File[], captureMethod: "LIVE" | "GALLERY", user: AccessTokenPayload) {
        const item = await ChecklistInstanceItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        await assertCanUpload(user, item);

        if (!files.length) {
            throw AppError.badRequest("No valid image files were received (check file type and size)");
        }

        if (item.requiresLivePhoto && captureMethod !== "LIVE") {
            files.forEach((f) => fs.unlink(f.path, () => {}));
            throw AppError.badRequest("This item requires a live camera photo, not a gallery upload");
        }

        if (item.maxImageCount != null) {
            const existingCount = await ChecklistInstanceImage.countDocuments({ checklistInstanceItemId: item._id });
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

        return ChecklistInstanceImage.insertMany(
            files.map((file) => ({
                url: `/uploads/checklist-instances/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                captureMethod,
                checklistInstanceItemId: item._id,
                uploadedBy: user.sub,
            })),
        );
    },

    async remove(imageId: string, user: AccessTokenPayload) {
        const image = await ChecklistInstanceImage.findById(imageId);
        if (!image) throw AppError.notFound("Image not found");

        const item = await ChecklistInstanceItem.findById(image.checklistInstanceItemId);
        if (item) await assertCanUpload(user, item);

        const absolutePath = path.resolve(process.cwd(), "uploads", "checklist-instances", path.basename(image.url));
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete image file from disk:", err);
        });

        await image.deleteOne();
        return image;
    },
};
