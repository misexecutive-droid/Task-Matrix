import { Types } from "mongoose"
import { ChecklistDefinition, type ChecklistRecurrence } from "../../models/ChecklistDefinition.js"
import { ChecklistDefinitionItem } from "../../models/ChecklistDefinitionItem.js"
import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { ChecklistInstanceImage } from "../../models/ChecklistInstanceImage.js"
import { ChecklistInstanceItemSubmission } from "../../models/ChecklistInstanceItemSubmission.js"
import { ChecklistInstanceItemSubmissionImage } from "../../models/ChecklistInstanceItemSubmissionImage.js"
import { generateInstanceForDefinition } from "../../jobs/checklistInstanceGenerator.job.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateChecklistDefinitionInput, UpdateChecklistDefinitionInput, SetChecklistDefinitionActiveInput } from "./checklistDefinition.validation.js"

export type ListChecklistDefinitionsFilter = {
    storeId?: string
    recurrence?: ChecklistRecurrence
    isActive?: boolean
}

const populateDefinition = (query: any) =>
    query.populate({ path: "items", options: { sort: { order: 1 } } })

// Completion rate (isDone across every generated instance's items) and photo-compliance rate
// (of items requiring a photo, what % actually got a qualifying one) per definition — same
// pipeline shape as checklistInstance.service.ts's own complianceReport, just grouped by
// definitionId instead of time bucket, so the Templates grid/detail page can show each
// checklist's real-world track record without an N+1 request per card.
const statsByDefinition = async (definitionIds: Types.ObjectId[]) => {
    const map = new Map<string, { completionRate: number | null; qualityRate: number | null }>()
    if (!definitionIds.length) return map

    const rows = await ChecklistInstanceItem.aggregate([
        { $lookup: { from: "checklistinstances", localField: "instanceId", foreignField: "_id", as: "instance" } },
        { $unwind: "$instance" },
        { $match: { "instance.definitionId": { $in: definitionIds } } },
        { $lookup: { from: "checklistinstanceimages", localField: "_id", foreignField: "checklistInstanceItemId", as: "images" } },
        {
            $addFields: {
                qualifyingImageCount: {
                    $cond: [
                        "$requiresLivePhoto",
                        { $size: { $filter: { input: "$images", cond: { $eq: ["$$this.captureMethod", "LIVE"] } } } },
                        { $size: "$images" },
                    ],
                },
            },
        },
        {
            $group: {
                _id: "$instance.definitionId",
                totalItems: { $sum: 1 },
                doneItems: { $sum: { $cond: ["$isDone", 1, 0] } },
                itemsRequiringPhotos: { $sum: { $cond: [{ $gt: ["$requiredImageCount", 0] }, 1, 0] } },
                photoCompliantItems: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gt: ["$requiredImageCount", 0] }, { $gte: ["$qualifyingImageCount", "$requiredImageCount"] }] },
                            1, 0,
                        ],
                    },
                },
            },
        },
    ])

    for (const r of rows) {
        map.set(r._id.toString(), {
            completionRate: r.totalItems ? Math.round((r.doneItems / r.totalItems) * 1000) / 10 : null,
            qualityRate: r.itemsRequiringPhotos ? Math.round((r.photoCompliantItems / r.itemsRequiringPhotos) * 1000) / 10 : null,
        })
    }
    return map
}

const withStats = (definition: any, stats: Map<string, { completionRate: number | null; qualityRate: number | null }>) => {
    const s = stats.get(definition._id.toString())
    return { ...definition.toObject({ virtuals: true }), completionRate: s?.completionRate ?? null, qualityRate: s?.qualityRate ?? null }
}

export const checklistDefinitionService = {
    async list(filter: ListChecklistDefinitionsFilter) {
        const query: Record<string, unknown> = {}
        // Mongo/Mongoose matches an array field against a scalar as "array contains this value",
        // so this correctly finds every definition live in the given store.
        if (filter.storeId) query.storeIds = filter.storeId
        if (filter.recurrence) query.recurrence = filter.recurrence
        if (filter.isActive !== undefined) query.isActive = filter.isActive
        const definitions = await populateDefinition(ChecklistDefinition.find(query).sort({ name: 1 }))
        const stats = await statsByDefinition(definitions.map((d: any) => d._id))
        return definitions.map((d: any) => withStats(d, stats))
    },

    async getById(id: string) {
        const definition = await populateDefinition(ChecklistDefinition.findById(id))
        if (!definition) throw AppError.notFound("Checklist not found")
        const stats = await statsByDefinition([definition._id])
        return withStats(definition, stats)
    },

    async create(input: CreateChecklistDefinitionInput, user: AccessTokenPayload) {
        const definition = await ChecklistDefinition.create({
            name: input.name,
            description: input.description ?? null,
            storeIds: input.storeIds,
            recurrence: input.recurrence,
            startDate: new Date(input.startDate),
            opensTime: input.opensTime ?? null,
            cutoffTime: input.cutoffTime ?? null,
            assigneeIds: input.assigneeIds,
            assigneeRoles: input.assigneeRoles ?? [],
            proofRequired: input.proofRequired ?? [],
            icon: input.icon,
            createdBy: user.sub,
        })

        await ChecklistDefinitionItem.insertMany(
            input.items.map((item, index) => ({ ...item, order: item.order ?? index, definitionId: definition._id })),
        )

        // Stamp out this definition's first instance right away if it's already due, instead of
        // making the admin wait for the generator job's next hourly tick.
        await generateInstanceForDefinition(definition, new Date())

        return populateDefinition(ChecklistDefinition.findById(definition._id))
    },

   
    async update(id: string, input: UpdateChecklistDefinitionInput) {
        const definition = await ChecklistDefinition.findById(id)
        if (!definition) throw AppError.notFound("Checklist not found")

        definition.set({
            name: input.name,
            description: input.description ?? null,
            storeIds: input.storeIds,
            recurrence: input.recurrence,
            startDate: new Date(input.startDate),
            opensTime: input.opensTime ?? null,
            cutoffTime: input.cutoffTime ?? null,
            assigneeIds: input.assigneeIds,
            assigneeRoles: input.assigneeRoles ?? [],
            proofRequired: input.proofRequired ?? [],
            icon: input.icon,
            version: (definition.get("version") ?? 1) + 1,
        })
        await definition.save()

        // Insert the new items BEFORE deleting the old ones, and delete by exclusion rather than
        // by definitionId alone - if insertMany fails partway, the old items are still intact
        // instead of the definition being left with zero items.
        const newItems = await ChecklistDefinitionItem.insertMany(
            input.items.map((item, index) => ({ ...item, order: item.order ?? index, definitionId: definition._id })),
        )
        await ChecklistDefinitionItem.deleteMany({
            definitionId: definition._id,
            _id: { $nin: newItems.map(item => item._id) },
        })

        // Only stamp out a fresh instance if this definition is still active - an admin editing a
        // deactivated checklist (e.g. fixing a label typo) shouldn't silently bring it back to life.
        if (definition.isActive) {
            await generateInstanceForDefinition(definition, new Date())
        }

        return populateDefinition(ChecklistDefinition.findById(definition._id))
    },


    async setActive(id: string, input: SetChecklistDefinitionActiveInput) {
        const definition = await ChecklistDefinition.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!definition) throw AppError.notFound("Checklist not found")
        return definition
    },

    async remove(id: string) {
        const definition = await ChecklistDefinition.findByIdAndDelete(id)
        if (!definition) throw AppError.notFound("Checklist not found")

        await ChecklistDefinitionItem.deleteMany({ definitionId: id })

        const instances = await ChecklistInstance.find({ definitionId: id }, { _id: 1 })
        const instanceIds = instances.map(instance => instance._id)
        if (instanceIds.length) {
            // Clean up every item's evidence photos too, same convention as checklist.service.ts's
            // removeChecklist — don't leave orphaned ChecklistInstanceImage records behind.
            const items = await ChecklistInstanceItem.find({ instanceId: { $in: instanceIds } }, { _id: 1 })
            const itemIds = items.map(i => i._id)
            await ChecklistInstanceImage.deleteMany({ checklistInstanceItemId: { $in: itemIds } })

            // Audit items also fan out into per-auditor submissions (+ their own evidence photos) —
            // clean those up too, same reasoning as the standard-item images just above.
            const submissions = await ChecklistInstanceItemSubmission.find({ itemId: { $in: itemIds } }, { _id: 1 })
            const submissionIds = submissions.map(s => s._id)
            await ChecklistInstanceItemSubmissionImage.deleteMany({ submissionId: { $in: submissionIds } })
            await ChecklistInstanceItemSubmission.deleteMany({ itemId: { $in: itemIds } })

            await ChecklistInstanceItem.deleteMany({ instanceId: { $in: instanceIds } })
            await ChecklistInstance.deleteMany({ definitionId: id })
        }

        return definition
    },
}
