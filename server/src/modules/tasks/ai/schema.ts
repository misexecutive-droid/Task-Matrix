export interface RawExtraction {
    title: string;
    context: string;
    assigneeName: string;
    department: string;
    dueDateISO: string;
    category: "issue" | "delegated_task";
    confidence: number;
}

export const EXTRACTION_JSON_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string", description: "Short, imperative task title" },
        context: { type: "string", description: "Additional detail beyond the title, or empty string" },
        assigneeName: {
            type: "string",
            description:
                "The person responsible for this task, however it's phrased — an imperative " +
                "(\"Harsh ko banana hai\", \"assign to Priya\") or an indirect reference to who it's " +
                "needed from/via (\"report chahiye from Swastika\", \"via Rohan\"). Empty string if no " +
                "person is mentioned at all.",
        },
        department: { type: "string", description: "Department name if mentioned, or empty string" },
        dueDateISO: { type: "string", description: "Resolved absolute due date/time in ISO 8601, using the supplied reference date" },
        category: { type: "string", enum: ["issue", "delegated_task"] },
        confidence: { type: "number", description: "0-1 confidence in this extraction" },

    },

    required: ["title", "context", "assigneeName", "department", "dueDateISO", "category", "confidence"],
    additionalProperties: false,
} as const;

export function buildExtractionPrompt(rawInput: string, referenceDate: Date): string {
    return [
        `Reference date/time (server, for resolving relative dates like "today"/"tomorrow"): ${referenceDate.toISOString()}`,
        `If no explicit time is mentioned, resolve the due date to 23:59:59 on the resolved day.`,
        `The instruction may be written in English, Hindi, or Hinglish (mixed Hindi-English, usually typed in Latin script) - understand it regardless of language mix, and always return field values in English.`,
        `The assignee isn't always phrased as a direct imperative — treat any of these as naming the assignee: "Harsh ko dashboard banana hai" (imperative), "assign this to Priya" (explicit), "sales ki report chahiye from Swastika" (needed FROM someone), "via Rohan" or "through Rohan" (routed through someone). Extract the name in all of these cases, not just the imperative one.`,
        `Extract structured task parameters from this instruction:`,
        `"""${rawInput}"""`,

    ].join("\n")
}   