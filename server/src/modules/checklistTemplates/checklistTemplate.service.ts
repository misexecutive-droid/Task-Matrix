import { ChecklistTemplate } from "../../models/ChecklistTemplate.js"
import { ChecklistTemplateItem } from "../../models/ChecklistTemplateItem.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type {
    CreateChecklistTemplateInput,
    UpdateChecklistTemplateInput,
    CreateChecklistTemplateItemInput,
    UpdateChecklistTemplateItemInput,
} from "./checklistTemplate.validation.js"

const populateTemplate = (query: any) =>
    query.populate({ path: "items", options: { sort: { order: 1 } } })

export const checklistTemplateService = {
    async list(appliesTo?: "TASK" | "TICKET") {
        return populateTemplate(ChecklistTemplate.find(appliesTo ? { appliesTo } : {}).sort({ name: 1 }))
    },

    async getById(id: string) {
        const template = await populateTemplate(ChecklistTemplate.findById(id))
        if (!template) throw AppError.notFound("Checklist template not found")
        return template
    },

    async create(input: CreateChecklistTemplateInput, user: AccessTokenPayload) {
        const template = await ChecklistTemplate.create({
            name: input.name,
            appliesTo: input.appliesTo,
            departmentId: input.departmentId ?? null,
            createdBy: user.sub,
        })

        if (input.items?.length) {
            await ChecklistTemplateItem.insertMany(
                input.items.map((item, index) => ({ ...item, order: item.order ?? index, templateId: template._id })),
            )
        }

        return populateTemplate(ChecklistTemplate.findById(template._id))
    },

    async update(id: string, input: UpdateChecklistTemplateInput) {
        const template = await ChecklistTemplate.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!template) throw AppError.notFound("Checklist template not found")
        return template
    },

    async remove(id: string) {
        const template = await ChecklistTemplate.findByIdAndDelete(id)
        if (!template) throw AppError.notFound("Checklist template not found")
        await ChecklistTemplateItem.deleteMany({ templateId: id })
        return template
    },

    async addItem(templateId: string, input: CreateChecklistTemplateItemInput) {
        const template = await ChecklistTemplate.findById(templateId)
        if (!template) throw AppError.notFound("Checklist template not found")
        return ChecklistTemplateItem.create({ ...input, templateId })
    },

    async updateItem(itemId: string, input: UpdateChecklistTemplateItemInput) {
        const item = await ChecklistTemplateItem.findByIdAndUpdate(itemId, input, { new: true, runValidators: true })
        if (!item) throw AppError.notFound("Checklist template item not found")
        return item
    },

    async removeItem(itemId: string) {
        const item = await ChecklistTemplateItem.findByIdAndDelete(itemId)
        if (!item) throw AppError.notFound("Checklist template item not found")
        return item
    },
}