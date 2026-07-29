import { z } from "zod";

// Same from/to convention as ticket.validation.ts's tatReportQuerySchema — plain optional ISO-ish
// date strings, parsed with `new Date(...)` in the service. The client computes the actual
// daily/weekly/monthly/quarterly/yearly range and sends it as from/to; the server just filters.
export const reportExportQuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    format: z.enum(["csv", "xlsx"]).default("csv"),
});

export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;
