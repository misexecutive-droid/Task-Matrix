import type { Request, Response } from "express"
import { checklistInstanceService, type InstanceStatusFilter } from "./checklistInstance.service.js"
import { setChecklistInstanceItemDoneSchema } from "./checklistInstance.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const checklistInstanceController = {
    // GET /checklist-instances/mine?status=OPEN|COMPLETED
    getMine: asyncHandler(async (req: Request, res: Response) => {
        const status = req.query.status as InstanceStatusFilter | undefined
        const instances = await checklistInstanceService.getMine(req.user!.sub, status)
        res.json({ success: true, data: instances })
    }),

    // GET /checklist-instances?definitionId=&departmentId=&status=  (ADMIN only)
    list: asyncHandler(async (req: Request, res: Response) => {
        const { definitionId, departmentId, status } = req.query
        const instances = await checklistInstanceService.listAll({
            definitionId: definitionId as string | undefined,
            departmentId: departmentId as string | undefined,
            status: status as InstanceStatusFilter | undefined,
        })
        res.json({ success: true, data: instances })
    }),

    getOne: asyncHandler(async (req: Request, res: Response) => {
        const instance = await checklistInstanceService.getById(req.params.id, req.user!)
        res.json({ success: true, data: instance })
    }),

    setItemDone: asyncHandler(async (req: Request, res: Response) => {
        const input = setChecklistInstanceItemDoneSchema.parse(req.body)
        const item = await checklistInstanceService.setItemDone(req.params.id, input.isDone, req.user!)
        res.json({ success: true, data: item })
    }),
}
