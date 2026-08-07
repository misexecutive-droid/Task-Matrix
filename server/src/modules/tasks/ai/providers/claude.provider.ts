import Anthropic from "@anthropic-ai/sdk"
import { EXTRACTION_JSON_SCHEMA, buildExtractionPrompt, type RawExtraction } from "../schema.js"

// Lazy — see openai.provider.ts for why (avoid crashing the whole server if this one
// provider's key isn't set; Anthropic's constructor doesn't throw eagerly like OpenAI's does,
// but building it lazily here too keeps all three providers consistent).
let client: Anthropic | null = null;
function getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    if (!client) client = new Anthropic();
    return client;
}

export async function extractWithClaude(rawInput: string, referenceDate: Date): Promise<RawExtraction> {
    const response = await getClient().messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        output_config: {
            effort: "low",
            format: { type: "json_schema", schema: EXTRACTION_JSON_SCHEMA },
        },

        messages: [{ role: "user", content: buildExtractionPrompt(rawInput, referenceDate) }]
    });

    if (response.stop_reason === "refusal") {
        throw new Error("Claude declined the extraction request")
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text block");
    return JSON.parse(textBlock.text) as RawExtraction;


}