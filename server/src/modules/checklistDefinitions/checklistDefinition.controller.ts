import type { Request, Response } from "express"
import { checklistDefinitionService } from "./checklistDefinition.service.js"
import { createChecklistDefinitionSchema, setChecklistDefinitionActiveSchema } from "./checklistDefinition.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import type { ChecklistRecurrence } from "../../models/ChecklistDefinition.js"

export const checklistDefinitionController = {
    // GET /checklist-definitions?departmentId=&recurrence=&isActive=
    list: asyncHandler(async (req: Request, res: Response) => {
        const { departmentId, recurrence, isActive } = req.query
        const definitions = await checklistDefinitionService.list({
            departmentId: departmentId as string | undefined,
            recurrence: recurrence as ChecklistRecurrence | undefined,
            isActive: isActive === undefined ? undefined : isActive === "true",
        })
        res.json({ success: true, data: definitions })
    }),

    getOne: asyncHandler(async (req: Request, res: Response) => {
        const definition = await checklistDefinitionService.getById(req.params.id)
        res.json({ success: true, data: definition })
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
        const input = createChecklistDefinitionSchema.parse(req.body)
        const definition = await checklistDefinitionService.create(input, req.user!)
        res.status(201).json({ success: true, data: definition })
    }),

    setActive: asyncHandler(async (req: Request, res: Response) => {
        const input = setChecklistDefinitionActiveSchema.parse(req.body)
        const definition = await checklistDefinitionService.setActive(req.params.id, input)
        res.json({ success: true, data: definition })
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
        await checklistDefinitionService.remove(req.params.id)
        res.json({ success: true, data: { deleted: true } })
    }),
}
