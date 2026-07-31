import { z } from "zod"
import { CAPTURE_METHODS } from "../../models/TaskImage.js"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const setChecklistInstanceItemDoneSchema = z.object({
    isDone: z.boolean(),
})

// Mirrors task.validation.ts's complianceReportQuerySchema — same groupBy/departmentId/from/to
// shape, so the client can drive both reports from one shared control.
export const checklistInstanceComplianceReportQuerySchema = z.object({
    groupBy: z.enum(["hour", "day", "week", "month", "year"]).default("day"),
    departmentId: objectId.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
})

// Same idea as checklistImages/checklistImage.validation.ts — the files themselves are validated
// by multer (config/upload.ts's checklistInstanceImageUpload), this just validates the one piece
// of metadata riding alongside them: how the photo was actually obtained.
export const uploadChecklistInstanceImageSchema = z.object({
    captureMethod: z.enum(CAPTURE_METHODS),
})

// Mirrors ticket.validation.ts's verifyTicketSchema — a note is required to reject, optional to
// approve.
export const verifyChecklistInstanceSchema = z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    note: z.string().optional(),
}).refine(v => v.action === "APPROVE" || !!v.note?.trim(), {
    message: "A note is required when rejecting.",
    path: ["note"],
})

export type SetChecklistInstanceItemDoneInput = z.infer<typeof setChecklistInstanceItemDoneSchema>
export type UploadChecklistInstanceImageInput = z.infer<typeof uploadChecklistInstanceImageSchema>
export type VerifyChecklistInstanceInput = z.infer<typeof verifyChecklistInstanceSchema>
export type ChecklistInstanceComplianceReportQuery = z.infer<typeof checklistInstanceComplianceReportQuerySchema>
