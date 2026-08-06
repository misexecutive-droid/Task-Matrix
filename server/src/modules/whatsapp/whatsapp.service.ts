import crypto from "node:crypto"
import { env } from "../../config/env.js"

const GRAPH_API_VERSION = "v20.0"

export async function sendWhatsAppMessage(to:string, body:string) {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`
    const res = await fetch(url, {
        method : "POST",
        headers : {
            Authorization : `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type" : "application/json",
        },

        body: JSON.stringify({
            messaging_product : "whatsapp",
            to,
            text : { body },
        }),
    });
    if(!res.ok){
        console.error("WhatsApp send failed : ", await res.text())
    }
}

export function verifySignature(rawBody : Buffer, signatureHeader : string | undefined) : boolean {
    if(!signatureHeader?.startsWith("sha256=")) return false;
    const expected = crypto.createHmac("sha256", env.WHATSAPP_APP_SECRET).update(rawBody).digest("hex");
    const provided = signatureHeader.slice("sha256=".length)
    const a = Buffer.from(expected , "hex")
    const b = Buffer.from(provided, "hex")

    return a.length === b.length && crypto.timingSafeEqual(a,b);
}