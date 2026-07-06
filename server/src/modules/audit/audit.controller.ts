import type { Request , Response } from "express"
import { auditService } from "./audit.service.js"
import { auditQuerySchema } from "./audit.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const auditController = {
    listForEntity : asyncHandler(async (req : Request , res : Response) => {
        const { entityType , entityId } = auditQuerySchema.parse(req.query);
        const logs = await auditService.listForEntity(entityType , entityId)
        res.json({ success : true , data : logs})
    })
}