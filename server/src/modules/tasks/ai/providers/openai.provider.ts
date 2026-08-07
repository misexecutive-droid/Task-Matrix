import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { buildExtractionPrompt, type RawExtraction } from "../schema.js";

// Built lazily (only when a request actually needs it) rather than at module load — the
// OpenAI SDK throws synchronously in its constructor when no key is set, which would crash
// the entire server on startup just because this one provider isn't configured yet.
let client: OpenAI | null = null;
function getClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return client;
}

const ExtractionZod = z.object({
    title: z.string(),
    context: z.string(),
    assigneeName: z.string(),
    department: z.string(),
    dueDateISO: z.string(),
    category: z.enum(["issue", "delegated_task"]),
    confidence: z.number(),
});

// Verify OPENAI_MODEL against your account's available models before deploying —
// pin it explicitly rather than trusting a hardcoded default here.
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function extractWithOpenAI(rawInput: string, referenceDate: Date): Promise<RawExtraction> {
    const completion = await getClient().chat.completions.parse({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: buildExtractionPrompt(rawInput, referenceDate) }],
        response_format: zodResponseFormat(ExtractionZod, "task_extraction"),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new Error("OpenAI returned no parsed extraction");
    return parsed;
}
