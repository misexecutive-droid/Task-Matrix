import OpenAI from "openai";
import { toFile } from "openai";
import { GoogleGenAI } from "@google/genai";
import { downloadWhatsAppMedia } from "./whatsapp.service.js";

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openaiClient;
}

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return geminiClient;
}

async function transcribeWithWhisper(buffer: Buffer, mimeType: string): Promise<string> {
    const file = await toFile(buffer, "voice-note.ogg", { type: mimeType });
    const transcription = await getOpenAI().audio.transcriptions.create({
        file,
        model: "whisper-1",
    });
    return transcription.text;
}

// Gemini can read audio directly as inline data - no separate transcription endpoint, just
// a generateContent call with the audio bytes attached and a prompt asking for the transcript.
async function transcribeWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
    const response = await getGemini().models.generateContent({
        model: "gemini-flash-latest",
        contents: [{
            role: "user",
            parts: [
                { text: "Transcribe this voice message word-for-word. Reply with only the transcript, nothing else." },
                { inlineData: { mimeType, data: buffer.toString("base64") } },
            ],
        }],
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty transcript");
    return text;
}

// Prefers Whisper when it's configured (dedicated transcription model, generally more
// accurate for speech-to-text); falls back to Gemini if OpenAI isn't set up or its call
// fails for any reason, so a voice note still gets transcribed either way. Shared by the
// WhatsApp voice-note path below and the web Smart Add recorder (task.ai.controller.ts).
export async function transcribeVoiceNote(buffer: Buffer, mimeType: string): Promise<string> {
    if (process.env.OPENAI_API_KEY) {
        try {
            return await transcribeWithWhisper(buffer, mimeType);
        } catch (err) {
            console.error("Whisper transcription failed, falling back to Gemini:", err);
        }
    }

    return transcribeWithGemini(buffer, mimeType);
}

export async function transcribeWhatsAppVoiceNote(mediaId: string): Promise<string> {
    const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);
    return transcribeVoiceNote(buffer, mimeType);
}
