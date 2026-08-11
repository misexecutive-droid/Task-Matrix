import crypto from "node:crypto"
import { env } from "../../config/env.js"

const SEND_TEXT_URL = "https://public.doubletick.io/whatsapp/message/text"

export async function sendDoubleTickMessage(to: string, body: string) {
    const res = await fetch(SEND_TEXT_URL, {
        method: "POST",
        headers: {
            Authorization: env.DOUBLETICK_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: env.DOUBLETICK_SENDER_NUMBER,
            to,
            content: { text: body },
        }),
    });
    if (!res.ok) {
        console.error("DoubleTick send failed : ", await res.text())
    }
}

export function verifyDoubleTickAuth(secret: string | undefined): boolean {
    if (!secret || !env.DOUBLETICK_WEBHOOK_SECRET) return false;
    const expected = Buffer.from(env.DOUBLETICK_WEBHOOK_SECRET);
    const provided = Buffer.from(secret);
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

export async function downloadDoubleTickAudio(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download DoubleTick audio: ${url}`);
    const mimeType = res.headers.get("content-type") || "audio/mpeg";
    return { buffer: Buffer.from(await res.arrayBuffer()), mimeType };
}
