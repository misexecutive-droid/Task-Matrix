import { Types } from "mongoose"
import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { ChecklistInstanceImage } from "../../models/ChecklistInstanceImage.js"
import { AppError } from "../../utils/AppError.js"
import { notificationService } from "../notifications/notification.service.js"
import { ticketService } from "../tickets/ticket.service.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { VerifyChecklistInstanceInput } from "./checklistInstance.validation.js"
import { ROLES , type Role } from "../../models/User.js"

export type InstanceStatusFilter = "OPEN" | "COMPLETED"

const populateInstance = (query: any) =>
    query.populate({
        path: "items",
        options: { sort: { order: 1 } },
        populate: [
            { path: "images" },
           
            {
                path: "submissions",
                populate: [{ path: "images" }, { path: "userId", select: "firstName lastName storeId" }],
            },
        ],
    })

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

// NUMBER_ENTRY counterpart to assertPhotosSatisfied — a reading is required (and must sit within
// the definition-authored min/max, when set) before the item can be marked done. Never trusts a
// value the client didn't just send: the item's own numericValue isn't consulted here, so a stale
// value from a previous run can't silently satisfy a fresh completion.
const assertNumberEntrySatisfied = (item: any, numericValue: number | undefined) => {
    if (numericValue == null || Number.isNaN(numericValue)) {
        throw AppError.badRequest("Enter a value before this item can be marked complete")
    }
    if (item.numberEntryMin != null && numericValue < item.numberEntryMin) {
        throw AppError.badRequest(`Value must be at least ${item.numberEntryMin}${item.numberEntryUnit ? ` ${item.numberEntryUnit}` : ""}`)
    }
    if (item.numberEntryMax != null && numericValue > item.numberEntryMax) {
        throw AppError.badRequest(`Value must be at most ${item.numberEntryMax}${item.numberEntryUnit ? ` ${item.numberEntryUnit}` : ""}`)
    }
}

// RATING counterpart — same numericValue slot as NUMBER_ENTRY, bounded to a whole star between 1
// and the definition-authored ratingScale (defaulting to 5 stars if never configured).
const assertRatingSatisfied = (item: any, numericValue: number | undefined) => {
    const scale = item.ratingScale ?? 5
    if (numericValue == null || Number.isNaN(numericValue) || !Number.isInteger(numericValue)) {
        throw AppError.badRequest("Pick a rating before this item can be marked complete")
    }
    if (numericValue < 1 || numericValue > scale) {
        throw AppError.badRequest(`Rating must be between 1 and ${scale}`)
    }
}

// YES_NO/PASS_FAIL counterpart — an explicit answer is required; "No"/"Fail" is a valid,
// completed answer, it just isn't a photo/number/etc., so this only checks presence.
const assertBooleanAnswerSatisfied = (booleanAnswer: "YES" | "NO" | undefined) => {
    if (booleanAnswer !== "YES" && booleanAnswer !== "NO") {
        throw AppError.badRequest("Choose an answer before this item can be marked complete")
    }
}

// MULTIPLE_CHOICE/DROPDOWN counterpart — the answer must be one of the definition-authored
// options, not just any non-empty string (unlike TEXT_BOX below).
const assertOptionSatisfied = (item: any, textValue: string | undefined) => {
    if (!textValue || !(item.options ?? []).includes(textValue)) {
        throw AppError.badRequest("Choose one of the listed options before this item can be marked complete")
    }
}

// TEXT_BOX counterpart — any non-empty answer is accepted, no option list to match against.
const assertTextSatisfied = (textValue: string | undefined) => {
    if (!textValue?.trim()) {
        throw AppError.badRequest("Enter an answer before this item can be marked complete")
    }
}

// DATE_TIME counterpart — must be a value the client actually sent and a parseable date.
const assertDateSatisfied = (dateValue: string | undefined) => {
    if (!dateValue || Number.isNaN(new Date(dateValue).getTime())) {
        throw AppError.badRequest("Pick a date before this item can be marked complete")
    }
}

// Great-circle distance in meters between two lat/lng points — used only to check a GPS reading
// against an optional definition-authored target + radius.
const EARTH_RADIUS_METERS = 6371000
const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

// GPS counterpart — a location reading is required; only checked against the definition-authored
// target when all three of gpsTargetLat/Lng/RadiusMeters are set (the schema refine in
// checklistDefinition.validation.ts guarantees lat/lng are set whenever radius is, so a plain
// null-check on all three is enough to know "is there a target to check against").
const assertGpsSatisfied = (item: any, lat: number | undefined, lng: number | undefined) => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
        throw AppError.badRequest("Capture your location before this item can be marked complete")
    }
    if (item.gpsTargetLat != null && item.gpsTargetLng != null && item.gpsRadiusMeters != null) {
        const distance = haversineMeters(lat, lng, item.gpsTargetLat, item.gpsTargetLng)
        if (distance > item.gpsRadiusMeters) {
            throw AppError.badRequest(
                `You're ${Math.round(distance)}m from the required location — must be within ${item.gpsRadiusMeters}m`,
            )
        }
    }
}

// QR_SCAN counterpart — reuses the same textValue slot TEXT_BOX/MULTIPLE_CHOICE do, but a scanned
// code additionally has to match qrExpectedValue when the definition authored one.
const assertQrSatisfied = (item: any, textValue: string | undefined) => {
    if (!textValue?.trim()) {
        throw AppError.badRequest("Scan a code before this item can be marked complete")
    }
    if (item.qrExpectedValue && textValue.trim() !== item.qrExpectedValue) {
        throw AppError.badRequest("Scanned code doesn't match the expected code")
    }
}

// SIGNATURE counterpart — just needs a non-empty drawing.
const assertSignatureSatisfied = (signatureValue: string | undefined) => {
    if (!signatureValue) {
        throw AppError.badRequest("Add a signature before this item can be marked complete")
    }
}

// DUAL_SIGNATURE counterpart — both signers must have signed.
const assertDualSignatureSatisfied = (signatureValue: string | undefined, secondSignatureValue: string | undefined) => {
    if (!signatureValue || !secondSignatureValue) {
        throw AppError.badRequest("Both signatures are required before this item can be marked complete")
    }
}

export type ItemValueInput = {
    numericValue?: number
    booleanAnswer?: "YES" | "NO"
    textValue?: string
    dateValue?: string
    gpsLat?: number
    gpsLng?: number
    gpsAccuracy?: number
    signatureValue?: string
    secondSignatureValue?: string
    conditionalReasonValue?: string
}

// One validator per value-bearing item type, keyed by itemType — a lookup instead of an
// if/else-if chain, so adding the next type means adding one entry here, not another branch to
// thread through setItemDone. CASH_TALLY reuses assertNumberEntrySatisfied outright — it's a
// NUMBER_ENTRY variant with an extra display-only field, not a different validation rule.
const VALUE_VALIDATORS_BY_ITEM_TYPE: Record<string, (item: any, values: ItemValueInput) => void> = {
    NUMBER_ENTRY: (item, v) => assertNumberEntrySatisfied(item, v.numericValue),
    RATING: (item, v) => assertRatingSatisfied(item, v.numericValue),
    YES_NO: (_item, v) => assertBooleanAnswerSatisfied(v.booleanAnswer),
    PASS_FAIL: (_item, v) => assertBooleanAnswerSatisfied(v.booleanAnswer),
    MULTIPLE_CHOICE: (item, v) => assertOptionSatisfied(item, v.textValue),
    DROPDOWN: (item, v) => assertOptionSatisfied(item, v.textValue),
    TEXT_BOX: (_item, v) => assertTextSatisfied(v.textValue),
    DATE_TIME: (_item, v) => assertDateSatisfied(v.dateValue),
    GPS: (item, v) => assertGpsSatisfied(item, v.gpsLat, v.gpsLng),
    QR_SCAN: (item, v) => assertQrSatisfied(item, v.textValue),
    CASH_TALLY: (item, v) => assertNumberEntrySatisfied(item, v.numericValue),
    SIGNATURE: (_item, v) => assertSignatureSatisfied(v.signatureValue),
    DUAL_SIGNATURE: (_item, v) => assertDualSignatureSatisfied(v.signatureValue, v.secondSignatureValue),
}

// Builder-authored "If answer is X then:" rules (see ChecklistDefinitionItem.conditionalTrigger/
// conditionalActions) — only ever meaningful for YES_NO/PASS_FAIL items, and only fire when the
// answer being submitted right now matches the trigger. REQUIRE_PHOTO/ASK_REASON are validated
// here (block completion until satisfied, same as the type validators above); CREATE_ISSUE/
// NOTIFY_AREA_MANAGER are side effects applied after validation passes.
const isConditionTriggered = (item: any, values: ItemValueInput) =>
    !!item.conditionalTrigger && item.conditionalTrigger === values.booleanAnswer

const assertConditionalActionsSatisfied = async (item: any, values: ItemValueInput) => {
    if (!isConditionTriggered(item, values)) return
    const actions: string[] = item.conditionalActions ?? []

    if (actions.includes("REQUIRE_PHOTO")) {
        const images = await ChecklistInstanceImage.find({ checklistInstanceItemId: item._id })
        const qualifying = item.requiresLivePhoto ? images.filter((img: any) => img.captureMethod === "LIVE").length : images.length
        if (qualifying < 1) {
            throw AppError.badRequest("Upload a photo before completing this item — your answer requires one")
        }
    }

    if (actions.includes("ASK_REASON")) {
        const reason = values.conditionalReasonValue ?? item.conditionalReasonValue
        if (!reason?.trim()) {
            throw AppError.badRequest("Enter a reason before completing this item — your answer requires one")
        }
    }
}

// Applies CREATE_ISSUE/NOTIFY_AREA_MANAGER after validation passes and the item has been saved —
// these are side effects, not completion gates. CREATE_ISSUE only fires once per item (guarded by
// issueId) so reopening/resubmitting the same "No" doesn't spawn duplicate tickets.
const applyConditionalSideEffects = async (item: any, instance: any, user: AccessTokenPayload, values: ItemValueInput) => {
    if (!isConditionTriggered(item, values)) return
    const actions: string[] = item.conditionalActions ?? []

    if (actions.includes("CREATE_ISSUE") && !item.issueId) {
        const reason = values.conditionalReasonValue ?? item.conditionalReasonValue
        const ticket = await ticketService.create({
            title: `Checklist flag: ${item.label}`,
            description: `Raised automatically from "${instance.title}" — "${item.label}" was answered "${values.booleanAnswer}".${reason ? ` Reason: ${reason}` : ""}`,
            storeId: instance.storeId?.toString(),
        }, user)
        item.issueId = ticket._id
        await item.save()
    }

    if (actions.includes("NOTIFY_AREA_MANAGER")) {
        await notificationService
            .notifyAreaManagersOfChecklistFlag(instance, item)
            .catch((err: unknown) => console.error("Failed to notify area manager of checklist flag:", err))
    }
}

// Recomputes verificationStatus after an item's isDone flips. Going all-done pushes it into
// PENDING (first submission, or an auto-resubmit after REJECTED) — unless it's already APPROVED,
// since approval is treated as a settled decision that a later item edit shouldn't silently
// reopen. Falling out of all-done while still PENDING pulls it back to NOT_SUBMITTED, since a PC
// shouldn't see an incomplete checklist sitting in their queue.
// Exported so checklistInstanceItemSubmission.service.ts can reuse this exact rule after an AUDIT
// item's derived isDone flips (see ChecklistInstanceItem.ts) — verification logic lives in one
// place regardless of which item type triggered the recompute.
export const syncVerificationStatus = async (instance: any) => {
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

// PC verification is store-scoped here (unlike Ticket's cross-department PC) — a PC only
// verifies checklist instances within their own store.

const CAN_VERIFY_BY_ROLE : Partial<Record <Role, (instance : any , user : AccessTokenPayload) => boolean>> = {
   ADMIN : () => true,
   PC : (instance, user) => Boolean(user.storeId) && instance.storeId?.toString() === user.storeId,
}

const assertCanVerify = (instance: any, user: AccessTokenPayload) => {
   const canVerify = CAN_VERIFY_BY_ROLE[user.role]?.(instance,user) ?? false
   if(!canVerify) throw AppError.forbidden()
}

export const checklistInstanceService = {
    async getMine(userId: string, status?: InstanceStatusFilter) {
        const instances = await populateInstance(
            ChecklistInstance.find({ assigneeIds: userId }).sort({ periodStart: -1 }),
        )
        return filterByStatus(instances, status)
    },

    async listAll(filter: { definitionId?: string; storeId?: string; status?: InstanceStatusFilter }) {
        const query: Record<string, unknown> = {}
        if (filter.definitionId) query.definitionId = filter.definitionId
        if (filter.storeId) query.storeId = filter.storeId
        const instances = await populateInstance(ChecklistInstance.find(query).sort({ periodStart: -1 }))
        return filterByStatus(instances, filter.status)
    },

    async getById(id: string, user: AccessTokenPayload) {
        const instance = await populateInstance(ChecklistInstance.findById(id))
        if (!instance) throw AppError.notFound("Checklist instance not found")
        assertCanAccess(instance, user)
        return instance
    },

    async setItemDone(itemId: string, isDone: boolean, user: AccessTokenPayload, values: ItemValueInput = {}) {
        const item = await ChecklistInstanceItem.findById(itemId)
        if (!item) throw AppError.notFound("Checklist item not found")

        const instance = await ChecklistInstance.findById(item.instanceId)
        if (!instance) throw AppError.notFound("Checklist instance not found")
        assertCanAccess(instance, user)

        if (isDone) {
            await assertPhotosSatisfied(item)
            VALUE_VALIDATORS_BY_ITEM_TYPE[item.itemType]?.(item, values)
            await assertConditionalActionsSatisfied(item, values)
        }

        // Persisted whenever sent, not just when marking done, so a partially-filled answer
        // survives a page refresh instead of forcing re-entry right before submitting.
        if (values.numericValue !== undefined) item.numericValue = values.numericValue as any
        if (values.booleanAnswer !== undefined) item.booleanAnswer = values.booleanAnswer as any
        if (values.textValue !== undefined) item.textValue = values.textValue as any
        if (values.dateValue !== undefined) item.dateValue = new Date(values.dateValue) as any
        if (values.gpsLat !== undefined) item.gpsLat = values.gpsLat as any
        if (values.gpsLng !== undefined) item.gpsLng = values.gpsLng as any
        if (values.gpsAccuracy !== undefined) item.gpsAccuracy = values.gpsAccuracy as any
        if (values.gpsLat !== undefined || values.gpsLng !== undefined) item.gpsCapturedAt = new Date() as any
        if (values.signatureValue !== undefined) item.signatureValue = values.signatureValue as any
        if (values.secondSignatureValue !== undefined) item.secondSignatureValue = values.secondSignatureValue as any
        if (values.conditionalReasonValue !== undefined) item.conditionalReasonValue = values.conditionalReasonValue as any
        item.isDone = isDone
        if (isDone) item.completedBy = user.sub as any
        await item.save()

        if (isDone) await applyConditionalSideEffects(item, instance, user, values)

        await syncVerificationStatus(instance)
        return item
    },

    // GET /checklist-instances/pending-verification — PC sees only their own store's queue,
    // ADMIN sees every store's.
    async listPendingVerification(user: AccessTokenPayload) {
        const query: Record<string, unknown> = { verificationStatus: "PENDING" }
        if (user.role === "PC") {
            if (!user.storeId) return []
            query.storeId = user.storeId
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

    // GET /checklist-instances/reports/compliance?groupBy=&storeId=&from=&to= (ADMIN only).
    // Mirrors taskService.complianceReport's shape/pipeline exactly, but buckets by the parent
    // instance's periodStart rather than the item's own createdAt — periodStart is the
    // semantically correct "which operational period does this belong to" field; createdAt is
    // just whenever the cron job happened to stamp the item out (could lag on a backfill run).
    async complianceReport(groupBy: "hour" | "day" | "week" | "month" | "year", storeId?: string, from?: string, to?: string) {
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
            ...(storeId ? [{ $match: { "instance.storeId": new Types.ObjectId(storeId) } }] : []),
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
