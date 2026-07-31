import { Types } from "mongoose"
import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { ChecklistInstanceImage } from "../../models/ChecklistInstanceImage.js"
import { AppError } from "../../utils/AppError.js"
import { notificationService } from "../notifications/notification.service.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { VerifyChecklistInstanceInput } from "./checklistInstance.validation.js"

export type InstanceStatusFilter = "OPEN" | "COMPLETED"

const populateInstance = (query: any) =>
    query.populate({ path: "items", populate: { path: "images" }, options: { sort: { order: 1 } } })

const isCompleted = (instance: any) => {
    const items = instance.items ?? []
    return items.length > 0 && items.every((item: any) => item.isDone)
}

const filterByStatus = (instances: any[], status?: InstanceStatusFilter) => {
    if (!status) return instances
    return instances.filter(instance => (status === "COMPLETED" ? isCompleted(instance) : !isCompleted(instance)))
}

const assertCanAccess = (instance: any, user: AccessTokenPayload) => {
    const isAssignee = instance.assigneeIds.some((id: any) => id.toString() === user.sub)
    if (user.role !== "ADMIN" && !isAssignee) throw AppError.forbidden()
}

// Same rule as checklist.service.ts's completeItem — never trust the client's isDone, always
// recount qualifying images from the DB before allowing an item to be marked done.
const assertPhotosSatisfied = async (item: any) => {
    if (item.requiredImageCount <= 0) return
    const images = await ChecklistInstanceImage.find({ checklistInstanceItemId: item._id })
    const qualifying = item.requiresLivePhoto ? images.filter((img: any) => img.captureMethod === "LIVE") : images
    if (qualifying.length < item.requiredImageCount) {
        const missing = item.requiredImageCount - qualifying.length
        const kind = item.requiresLivePhoto ? "live photo(s)" : "photo(s)"
        throw AppError.badRequest(`Upload ${missing} more ${kind} before this item can be marked complete`)
    }
}

// Recomputes verificationStatus after an item's isDone flips. Going all-done pushes it into
// PENDING (first submission, or an auto-resubmit after REJECTED) — unless it's already APPROVED,
// since approval is treated as a settled decision that a later item edit shouldn't silently
// reopen. Falling out of all-done while still PENDING pulls it back to NOT_SUBMITTED, since a PC
// shouldn't see an incomplete checklist sitting in their queue.
const syncVerificationStatus = async (instance: any) => {
    const items = await ChecklistInstanceItem.find({ instanceId: instance._id })
    const allDone = items.length > 0 && items.every((i: any) => i.isDone)

    if (allDone && instance.verificationStatus !== "APPROVED") {
        if (instance.verificationStatus !== "PENDING") {
            instance.verificationStatus = "PENDING"
            await instance.save()
            notificationService
                .notifyChecklistPendingVerification(instance)
                .catch((err) => console.error("Failed to notify PC of pending checklist:", err))
        }
    } else if (!allDone && instance.verificationStatus === "PENDING") {
        instance.verificationStatus = "NOT_SUBMITTED"
        await instance.save()
    }
}

// PC verification is department-scoped here (unlike Ticket's cross-department PC) — a PC only
// verifies checklist instances within their own department.
const assertCanVerify = (instance: any, user: AccessTokenPayload) => {
    if (user.role === "ADMIN") return
    if (user.role === "PC" && user.departmentId && instance.departmentId.toString() === user.departmentId) return
    throw AppError.forbidden()
}

export const checklistInstanceService = {
    async getMine(userId: string, status?: InstanceStatusFilter) {
        const instances = await populateInstance(
            ChecklistInstance.find({ assigneeIds: userId }).sort({ periodStart: -1 }),
        )
        return filterByStatus(instances, status)
    },

    async listAll(filter: { definitionId?: string; departmentId?: string; status?: InstanceStatusFilter }) {
        const query: Record<string, unknown> = {}
        if (filter.definitionId) query.definitionId = filter.definitionId
        if (filter.departmentId) query.departmentId = filter.departmentId
        const instances = await populateInstance(ChecklistInstance.find(query).sort({ periodStart: -1 }))
        return filterByStatus(instances, filter.status)
    },

    async getById(id: string, user: AccessTokenPayload) {
        const instance = await populateInstance(ChecklistInstance.findById(id))
        if (!instance) throw AppError.notFound("Checklist instance not found")
        assertCanAccess(instance, user)
        return instance
    },

    async setItemDone(itemId: string, isDone: boolean, user: AccessTokenPayload) {
        const item = await ChecklistInstanceItem.findById(itemId)
        if (!item) throw AppError.notFound("Checklist item not found")

        const instance = await ChecklistInstance.findById(item.instanceId)
        if (!instance) throw AppError.notFound("Checklist instance not found")
        assertCanAccess(instance, user)

        if (isDone) await assertPhotosSatisfied(item)

        item.isDone = isDone
        if (isDone) item.completedBy = user.sub as any
        await item.save()

        await syncVerificationStatus(instance)
        return item
    },

    // GET /checklist-instances/pending-verification — PC sees only their own department's queue,
    // ADMIN sees every department's.
    async listPendingVerification(user: AccessTokenPayload) {
        const query: Record<string, unknown> = { verificationStatus: "PENDING" }
        if (user.role === "PC") {
            if (!user.departmentId) return []
            query.departmentId = user.departmentId
        }
        return populateInstance(ChecklistInstance.find(query).sort({ periodStart: -1 }))
    },

    async verify(id: string, input: VerifyChecklistInstanceInput, user: AccessTokenPayload) {
        const instance = await ChecklistInstance.findById(id)
        if (!instance) throw AppError.notFound("Checklist instance not found")
        assertCanVerify(instance, user)

        if (instance.verificationStatus !== "PENDING") {
            throw AppError.badRequest("This checklist isn't pending verification.")
        }

        if (input.action === "APPROVE") {
            instance.verificationStatus = "APPROVED"
            instance.verifiedBy = user.sub as any
            instance.verifiedAt = new Date()
            instance.verificationNote = input.note ?? null
        } else {
            instance.verificationStatus = "REJECTED"
            instance.verificationNote = input.note ?? null
        }
        await instance.save()

        notificationService
            .notifyChecklistVerificationResult(instance, input.action, input.note)
            .catch((err) => console.error("Failed to notify checklist verification result:", err))

        return populateInstance(ChecklistInstance.findById(instance._id))
    },

    // GET /checklist-instances/reports/compliance?groupBy=&departmentId=&from=&to= (ADMIN only).
    // Mirrors taskService.complianceReport's shape/pipeline exactly, but buckets by the parent
    // instance's periodStart rather than the item's own createdAt — periodStart is the
    // semantically correct "which operational period does this belong to" field; createdAt is
    // just whenever the cron job happened to stamp the item out (could lag on a backfill run).
    async complianceReport(groupBy: "hour" | "day" | "week" | "month" | "year", departmentId?: string, from?: string, to?: string) {
        const DATE_FORMATS: Record<"hour" | "day" | "week" | "month" | "year", string> = {
            hour: '%Y-%m-%dT%H:00',
            day: '%Y-%m-%d',
            week: '%G-W%V',
            month: '%Y-%m',
            year: '%Y',
        };

        const rows = await ChecklistInstanceItem.aggregate([
            { $lookup: { from: "checklistinstances", localField: "instanceId", foreignField: "_id", as: "instance" } },
            { $unwind: "$instance" },
            ...(departmentId ? [{ $match: { "instance.departmentId": new Types.ObjectId(departmentId) } }] : []),
            ...(from || to ? [{
                $match: {
                    "instance.periodStart": {
                        ...(from ? { $gte: new Date(from) } : {}),
                        ...(to ? { $lte: new Date(to) } : {}),
                    },
                },
            }] : []),
            { $lookup: { from: "checklistinstanceimages", localField: "_id", foreignField: "checklistInstanceItemId", as: "images" } },
            {
                $addFields: {
                    bucket: { $dateToString: { format: DATE_FORMATS[groupBy], date: "$instance.periodStart" } },
                    qualifyingImageCount: {
                        $cond: [
                            '$requiresLivePhoto',
                            { $size: { $filter: { input: '$images', cond: { $eq: ['$$this.captureMethod', 'LIVE'] } } } },
                            { $size: '$images' },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$bucket",
                    totalItems: { $sum: 1 },
                    doneItems: { $sum: { $cond: ["$isDone", 1, 0] } },
                    itemsRequiringPhotos: { $sum: { $cond: [{ $gt: ["$requiredImageCount", 0] }, 1, 0] } },
                    photoCompliantItems: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gt: ['$requiredImageCount', 0] }, { $gte: ["$qualifyingImageCount", "$requiredImageCount"] }] },
                                1, 0,
                            ],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return rows.map(r => ({
            bucket: r._id as string,
            totalItems: r.totalItems as number,
            doneItems: r.doneItems as number,
            completionRate: r.totalItems ? Math.round((r.doneItems / r.totalItems) * 1000) / 10 : null,
            itemsRequiringPhotos: r.itemsRequiringPhotos as number,
            qualityRate: r.itemsRequiringPhotos ? Math.round((r.photoCompliantItems / r.itemsRequiringPhotos) * 1000) / 10 : null,
        }));
    },
}
