import type { Request, Response } from "express"
import { checklistInstanceService, type InstanceStatusFilter } from "./checklistInstance.service.js"
import { setChecklistInstanceItemDoneSchema, verifyChecklistInstanceSchema, checklistInstanceComplianceReportQuerySchema } from "./checklistInstance.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const checklistInstanceController = {
    // GET /checklist-instances/mine?status=OPEN|COMPLETED
    getMine: asyncHandler(async (req: Request, res: Response) => {
        const status = req.query.status as InstanceStatusFilter | undefined
        const instances = await checklistInstanceService.getMine(req.user!.sub, status)
        res.json({ success: true, data: instances })
    }),

    // GET /checklist-instances?definitionId=&storeId=&status=  (ADMIN only)
    list: asyncHandler(async (req: Request, res: Response) => {
        const { definitionId, storeId, status } = req.query
        const instances = await checklistInstanceService.listAll({
            definitionId: definitionId as string | undefined,
            storeId: storeId as string | undefined,
            status: status as InstanceStatusFilter | undefined,
        })
        res.json({ success: true, data: instances })
    }),

    // GET /checklist-instances/pending-verification (PC own-store / ADMIN all)
    listPendingVerification: asyncHandler(async (req: Request, res: Response) => {
        const instances = await checklistInstanceService.listPendingVerification(req.user!)
        res.json({ success: true, data: instances })
    }),

    getOne: asyncHandler(async (req: Request, res: Response) => {
        const instance = await checklistInstanceService.getById(req.params.id, req.user!)
        res.json({ success: true, data: instance })
    }),

    setItemDone: asyncHandler(async (req: Request, res: Response) => {
        const { isDone, ...values } = setChecklistInstanceItemDoneSchema.parse(req.body)
        const item = await checklistInstanceService.setItemDone(req.params.id, isDone, req.user!, values)
        res.json({ success: true, data: item })
    }),

    // PATCH /checklist-instances/:id/verify (PC own-department / ADMIN all)
    verify: asyncHandler(async (req: Request, res: Response) => {
        const input = verifyChecklistInstanceSchema.parse(req.body)
        const instance = await checklistInstanceService.verify(req.params.id, input, req.user!)
        res.json({ success: true, data: instance })
    }),

    // GET /checklist-instances/reports/compliance?groupBy=&storeId=&from=&to= (ADMIN only)
    complianceReport: asyncHandler(async (req: Request, res: Response) => {
        const query = checklistInstanceComplianceReportQuerySchema.parse(req.query)
        const data = await checklistInstanceService.complianceReport(query.groupBy, query.storeId, query.from, query.to)
        res.json({ success: true, data })
    }),
}
