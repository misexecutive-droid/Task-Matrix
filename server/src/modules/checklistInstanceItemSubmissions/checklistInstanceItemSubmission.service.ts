import { ChecklistInstanceItemSubmission } from "../../models/ChecklistInstanceItemSubmission.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItemSubmissionImage } from "../../models/ChecklistInstanceItemSubmissionImage.js"
import { AppError } from "../../utils/AppError.js"
import { syncVerificationStatus } from "../checklistInstances/checklistInstance.service.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { UpdateChecklistInstanceItemSubmissionAccessoriesInput, UpdateChecklistInstanceItemSubmissionRemarksInput } from "./checklistInstanceItemSubmission.validation.js"

// A submission belongs to exactly one named auditor (ChecklistDefinitionItem.auditUserIds names
// specific people, not a group) — tighter than the item-level "any instance assignee" check used
// for STANDARD items.
export const assertCanAccess = (submission: any, user: AccessTokenPayload) => {
    if (user.role === "ADMIN") return
    if (submission.userId.toString() === user.sub) return
    throw AppError.forbidden("Only the named auditor can act on this submission")
}

const assertNotLocked = (submission: any) => {
    if (submission.isDone) throw AppError.badRequest("Reopen this submission before editing it")
}

// Never trust the client's isDone — recount qualifying evidence photos from the DB first, same
// rule as checklistInstance.service.ts's assertPhotosSatisfied, just scoped to this one
// submission's own photos rather than the whole item's shared pool.
const assertPhotosSatisfied = async (submission: any, item: any) => {
    if (item.requiredImageCount <= 0) return
    const images = await ChecklistInstanceItemSubmissionImage.find({ submissionId: submission._id })
    const qualifying = item.requiresLivePhoto ? images.filter((img: any) => img.captureMethod === "LIVE") : images
    if (qualifying.length < item.requiredImageCount) {
        const missing = item.requiredImageCount - qualifying.length
        const kind = item.requiresLivePhoto ? "live photo(s)" : "photo(s)"
        throw AppError.badRequest(`Upload ${missing} more ${kind} before this submission can be marked done`)
    }
}

const loadSubmissionAndItem = async (submissionId: string) => {
    const submission = await ChecklistInstanceItemSubmission.findById(submissionId)
    if (!submission) throw AppError.notFound("Submission not found")
    const item = await ChecklistInstanceItem.findById(submission.itemId)
    if (!item) throw AppError.notFound("Checklist item not found")
    return { submission, item }
}

// Recomputes the parent AUDIT item's derived isDone (true once every sibling submission is done)
// and re-syncs the instance's verificationStatus off the back of that — see ChecklistInstanceItem.ts
// for why this is what lets syncVerificationStatus (and every other item.isDone consumer) keep
// working completely unmodified for audit items.
const recomputeItemAndVerification = async (item: any) => {
    const siblings = await ChecklistInstanceItemSubmission.find({ itemId: item._id })
    const allDone = siblings.length > 0 && siblings.every((s: any) => s.isDone)
    if (item.isDone !== allDone) {
        item.isDone = allDone
        await item.save()
    }

    const instance = await ChecklistInstance.findById(item.instanceId)
    if (instance) await syncVerificationStatus(instance)
}

export const checklistInstanceItemSubmissionService = {
    async updateAccessories(id: string, accessories: UpdateChecklistInstanceItemSubmissionAccessoriesInput["accessories"], user: AccessTokenPayload) {
        const { submission } = await loadSubmissionAndItem(id)
        assertCanAccess(submission, user)
        assertNotLocked(submission)
        submission.accessories = accessories as any
        await submission.save()
        return submission
    },

    async updateRemarks(id: string, remarks: UpdateChecklistInstanceItemSubmissionRemarksInput["remarks"], user: AccessTokenPayload) {
        const { submission } = await loadSubmissionAndItem(id)
        assertCanAccess(submission, user)
        assertNotLocked(submission)
        submission.remarks = remarks
        await submission.save()
        return submission
    },

    async setDone(id: string, isDone: boolean, user: AccessTokenPayload) {
        const { submission, item } = await loadSubmissionAndItem(id)
        assertCanAccess(submission, user)

        if (isDone) await assertPhotosSatisfied(submission, item)

        submission.isDone = isDone
        await submission.save()

        await recomputeItemAndVerification(item)
        return submission
    },
}
