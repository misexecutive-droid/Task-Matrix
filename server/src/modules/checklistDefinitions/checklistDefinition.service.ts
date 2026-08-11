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

export const checklistDefinitionService = {
    async list(filter: ListChecklistDefinitionsFilter) {
        const query: Record<string, unknown> = {}
        // Mongo/Mongoose matches an array field against a scalar as "array contains this value",
        // so this correctly finds every definition live in the given store.
        if (filter.storeId) query.storeIds = filter.storeId
        if (filter.recurrence) query.recurrence = filter.recurrence
        if (filter.isActive !== undefined) query.isActive = filter.isActive
        return populateDefinition(ChecklistDefinition.find(query).sort({ name: 1 }))
    },

    async getById(id: string) {
        const definition = await populateDefinition(ChecklistDefinition.findById(id))
        if (!definition) throw AppError.notFound("Checklist not found")
        return definition
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
