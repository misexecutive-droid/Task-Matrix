import ExcelJS from "exceljs";
import type { CsvColumn } from "./csv.js";

export const toXlsx = async (
    rows: Record<string, unknown>[],
    columns: CsvColumn[],
    sheetName = "Report",
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 4, 14) }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};
