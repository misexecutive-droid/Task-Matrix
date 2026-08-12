import { z } from "zod"
import { CAPTURE_METHODS } from "../../models/TaskImage.js"
import { objectId } from "../../utils/index.js"

// Every field below only matters for its own itemType — checklistInstance.service.ts's
// setItemDone dispatches to the one relevant validator/persist step per item's itemType and
// ignores the rest, so sending an unrelated field is a harmless no-op.
export const setChecklistInstanceItemDoneSchema = z.object({
    isDone: z.boolean(),
    numericValue: z.number().optional(),      // NUMBER_ENTRY, RATING, CASH_TALLY
    booleanAnswer: z.enum(["YES", "NO"]).optional(), // YES_NO, PASS_FAIL
    textValue: z.string().optional(),          // MULTIPLE_CHOICE, DROPDOWN, TEXT_BOX, QR_SCAN
    dateValue: z.string().optional(),          // DATE_TIME (ISO string)
    gpsLat: z.number().min(-90).max(90).optional(),   // GPS
    gpsLng: z.number().min(-180).max(180).optional(), // GPS
    gpsAccuracy: z.number().min(0).optional(),        // GPS
    signatureValue: z.string().optional(),       // SIGNATURE, DUAL_SIGNATURE
    secondSignatureValue: z.string().optional(), // DUAL_SIGNATURE
    conditionalReasonValue: z.string().optional(), // ASK_REASON conditional action
})

// Mirrors task.validation.ts's complianceReportQuerySchema — same groupBy/storeId/from/to
// shape, so the client can drive both reports from one shared control.
export const checklistInstanceComplianceReportQuerySchema = z.object({
    groupBy: z.enum(["hour", "day", "week", "month", "year"]).default("day"),
    storeId: objectId.optional(),
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
