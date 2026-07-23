import { ChecklistDefinition, type ChecklistRecurrence } from "../../models/ChecklistDefinition.js"
import { ChecklistDefinitionItem } from "../../models/ChecklistDefinitionItem.js"
import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateChecklistDefinitionInput, SetChecklistDefinitionActiveInput } from "./checklistDefinition.validation.js"

export type ListChecklistDefinitionsFilter = {
    departmentId?: string
    recurrence?: ChecklistRecurrence
    isActive?: boolean
}

const populateDefinition = (query: any) =>
    query.populate({ path: "items", options: { sort: { order: 1 } } })

export const checklistDefinitionService = {
    async list(filter: ListChecklistDefinitionsFilter) {
        const query: Record<string, unknown> = {}
        if (filter.departmentId) query.departmentId = filter.departmentId
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
            departmentId: input.departmentId,
            recurrence: input.recurrence,
            startDate: new Date(input.startDate),
            assigneeIds: input.assigneeIds,
            createdBy: user.sub,
        })

        await ChecklistDefinitionItem.insertMany(
            input.items.map((item, index) => ({ ...item, order: item.order ?? index, definitionId: definition._id })),
        )

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
            await ChecklistInstanceItem.deleteMany({ instanceId: { $in: instanceIds } })
            await ChecklistInstance.deleteMany({ definitionId: id })
        }

        return definition
    },
}
