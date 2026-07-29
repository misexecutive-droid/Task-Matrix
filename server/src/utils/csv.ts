export type CsvColumn = { key: string; label: string };

// Minimal RFC-4180-ish CSV encoder — no external dependency needed for something this small.
// Quotes any value containing a comma, quote, or newline, doubling embedded quotes.
const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const toCsv = (rows: Record<string, unknown>[], columns: CsvColumn[]): string => {
    const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
    const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(","));
    return [header, ...lines].join("\r\n");
};
