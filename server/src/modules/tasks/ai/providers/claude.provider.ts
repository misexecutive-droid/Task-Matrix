import Anthropic from "@anthropic-ai/sdk"
import { EXTRACTION_JSON_SCHEMA, buildExtractionPrompt, type RawExtraction } from "../schema.js"
import { withTimeout, lazyClient } from "../../../../utils/index.js"

const EXTRACTION_TIMEOUT_MS = 20_000

const getClient = lazyClient("ANTHROPIC_API_KEY", () => new Anthropic())

export async function extractWithClaude(rawInput: string, referenceDate: Date): Promise<RawExtraction> {
    const response = await withTimeout(getClient().messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        thinking: { type: "disabled" },
        output_config: {
            effort: "low",
            format: { type: "json_schema", schema: EXTRACTION_JSON_SCHEMA },
        },

        messages: [{ role: "user", content: buildExtractionPrompt(rawInput, referenceDate) }]
    }), EXTRACTION_TIMEOUT_MS, "Claude extraction");

    if (response.stop_reason === "refusal") {
        throw new Error("Claude declined the extraction request")
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text block");
    return JSON.parse(textBlock.text) as RawExtraction;


}