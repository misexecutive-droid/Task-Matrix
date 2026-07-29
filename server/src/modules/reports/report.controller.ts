import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { reportExportQuerySchema } from "./report.validation.js";
import { REPORT_ROW_FETCHERS, REPORT_COLUMNS, type ReportModule } from "./report.service.js";
import { toCsv } from "../../utils/csv.js";
import { toXlsx } from "../../utils/xlsx.js";

const CONTENT_TYPES: Record<"csv" | "xlsx", string> = {
    csv: "text/csv; charset=utf-8",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// One handler factory shared by all three export routes — only the `module` (which rows/columns
// to use) differs, so the request-handling shape (parse query, fetch rows, serialize, respond)
// is written once instead of three near-identical copies.
const exportHandler = (reportModule: ReportModule) =>
    asyncHandler(async (req: Request, res: Response) => {
        const { from, to, format } = reportExportQuerySchema.parse(req.query);
        const rows = await REPORT_ROW_FETCHERS[reportModule](from, to);
        const columns = REPORT_COLUMNS[reportModule];

        const datePart = new Date().toISOString().slice(0, 10);
        const filename = `${reportModule}-export-${datePart}.${format}`;

        res.setHeader("Content-Type", CONTENT_TYPES[format]);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        if (format === "xlsx") {
            const buffer = await toXlsx(rows, columns, reportModule);
            res.send(buffer);
        } else {
            res.send(toCsv(rows, columns));
        }
    });

export const reportController = {
    exportTickets: exportHandler("tickets"),
    exportTasks: exportHandler("tasks"),
    exportChecklists: exportHandler("checklists"),
};
