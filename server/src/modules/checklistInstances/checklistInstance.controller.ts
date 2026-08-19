import type { Request, Response } from "express"
import { checklistInstanceService, type InstanceStatusFilter } from "./checklistInstance.service.js"
import { setChecklistInstanceItemDoneSchema, verifyChecklistInstanceSchema, checklistInstanceComplianceReportQuerySchema } from "./checklistInstance.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { resolveReportScope, resolveStoreIdForDepartment } from "../../utils/reportScope.js"

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

    // GET /checklist-instances/reports/compliance?groupBy=&storeId=&from=&to=
    // ADMIN/PC may pass any storeId (or none, for org-wide). SENIOR is forced to their own
    // store regardless of what's in the query — a SENIOR must never be able to read another
    // store's data by passing a different storeId. MANAGER has no store of their own, but their
    // department can optionally have a home store (Department.storeId) — resolve it so a
    // department head's checklist view isn't just org-wide.
    complianceReport: asyncHandler(async (req: Request, res: Response) => {
        const query = checklistInstanceComplianceReportQuerySchema.parse(req.query)
        const { storeId: baseStoreId } = resolveReportScope(req.user!, { storeId: query.storeId })
        const storeId = req.user!.role === "MANAGER" && req.user!.departmentId
            ? await resolveStoreIdForDepartment(req.user!.departmentId)
            : baseStoreId;
        const data = await checklistInstanceService.complianceReport(query.groupBy, storeId, query.from, query.to)
        res.json({ success: true, data })
    }),
}
