import path from "node:path"
import fs from "node:fs"
import { ChecklistInstanceItemSubmission } from "../../models/ChecklistInstanceItemSubmission.js"
import { ChecklistInstanceItemSubmissionImage } from "../../models/ChecklistInstanceItemSubmissionImage.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { AppError } from "../../utils/AppError.js"
import { assertCanAccess } from "../checklistInstanceItemSubmissions/checklistInstanceItemSubmission.service.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"

const UPLOAD_DIR = "checklist-instance-submissions"

// Best-effort cleanup for files multer already wrote to disk before a validation check below
// rejects the request — same fire-and-forget pattern as remove()'s disk delete.
const discardFiles = (files: Express.Multer.File[]) => files.forEach((f) => fs.unlink(f.path, () => {}))

export const checklistInstanceItemSubmissionImageService = {
    async upload(submissionId: string, files: Express.Multer.File[], captureMethod: "LIVE" | "GALLERY", user: AccessTokenPayload) {
        const submission = await ChecklistInstanceItemSubmission.findById(submissionId)
        if (!submission) throw AppError.notFound("Submission not found")
        assertCanAccess(submission, user)

        const item = await ChecklistInstanceItem.findById(submission.itemId)
        if (!item) throw AppError.notFound("Checklist item not found")

        if (!files.length) {
            throw AppError.badRequest("No valid image files were received (check file type and size)")
        }

        if (item.requiresLivePhoto && captureMethod !== "LIVE") {
            discardFiles(files)
            throw AppError.badRequest("This item requires a live camera photo, not a gallery upload")
        }

        if (item.maxImageCount != null) {
            const existingCount = await ChecklistInstanceItemSubmissionImage.countDocuments({ submissionId: submission._id })
            if (existingCount + files.length > item.maxImageCount) {
                discardFiles(files)
                const remaining = Math.max(item.maxImageCount - existingCount, 0)
                throw AppError.badRequest(
                    remaining > 0
                        ? `This item allows at most ${item.maxImageCount} photo(s) — only ${remaining} more can be uploaded`
                        : `This item already has the maximum of ${item.maxImageCount} photo(s)`,
                )
            }
        }

        return ChecklistInstanceItemSubmissionImage.insertMany(
            files.map((file) => ({
                url: `/uploads/${UPLOAD_DIR}/${path.basename(file.path)}`,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                captureMethod,
                submissionId: submission._id,
                uploadedBy: user.sub,
            })),
        )
    },

    async remove(imageId: string, user: AccessTokenPayload) {
        const image = await ChecklistInstanceItemSubmissionImage.findById(imageId)
        if (!image) throw AppError.notFound("Image not found")

        const submission = await ChecklistInstanceItemSubmission.findById(image.submissionId)
        if (submission) assertCanAccess(submission, user)

        const absolutePath = path.resolve(process.cwd(), "uploads", UPLOAD_DIR, path.basename(image.url))
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete image file from disk:", err)
        })

        await image.deleteOne()
        return image
    },
}
