import Anthropic from "@anthropic-ai/sdk"
import { EXTRACTION_JSON_SCHEMA, buildExtractionPrompt, type RawExtraction } from "../schema.js"

const client = new Anthropic();

export async function extractWithClaude(rawInput: string, referenceDate: Date): Promise<RawExtraction> {
    const response = await client.messages.create({
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