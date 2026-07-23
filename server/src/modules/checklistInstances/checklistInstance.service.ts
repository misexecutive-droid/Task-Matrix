import { ChecklistInstance } from "../../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../../models/ChecklistInstanceItem.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"

export type InstanceStatusFilter = "OPEN" | "COMPLETED"

const populateInstance = (query: any) =>
    query.populate({ path: "items", options: { sort: { order: 1 } } })

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

        item.isDone = isDone
        if (isDone) item.completedBy = user.sub as any
        await item.save()
        return item
    },
}
