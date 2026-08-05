import { GoogleGenAI, Type } from "@google/genai";
import { EXTRACTION_JSON_SCHEMA, buildExtractionPrompt, type RawExtraction } from "../schema.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// @google/genai wants its own Type enum rather than plain JSON Schema strings.
const GEMINI_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: EXTRACTION_JSON_SCHEMA.properties.title.description },
        context: { type: Type.STRING, description: EXTRACTION_JSON_SCHEMA.properties.context.description },
        assigneeName: { type: Type.STRING, description: EXTRACTION_JSON_SCHEMA.properties.assigneeName.description },
        department: { type: Type.STRING, description: EXTRACTION_JSON_SCHEMA.properties.department.description },
        dueDateISO: { type: Type.STRING, description: EXTRACTION_JSON_SCHEMA.properties.dueDateISO.description },
        category: { type: Type.STRING, enum: ["issue", "delegated_task"] },
        confidence: { type: Type.NUMBER },
    },
    required: [...EXTRACTION_JSON_SCHEMA.required],
};

export async function extractWithGemini(rawInput: string, referenceDate: Date): Promise<RawExtraction> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: buildExtractionPrompt(rawInput, referenceDate) }] }],
        config: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA },
    });
    return JSON.parse(response.text ?? "{}") as RawExtraction;
}
