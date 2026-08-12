import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { User } from "../../models/User.js"
import { extractTaskFromText, resolveAssignee, resolveDueDate, priorityForCreatorRank } from "../tasks/ai/providers/task.ai.service.js"
import { taskService } from "../tasks/task.service.js";
import { sendWhatsAppMessage, verifySignature } from "./whatsapp.service.js";
import { transcribeWhatsAppVoiceNote } from "./transcription.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { departmentService } from "../departments/department.service.js";

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

export const whatsappController = {
    verify : (req : Request, res : Response) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"]

        if(mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN){
            return res.status(200).send(challenge)
        }
        return res.sendStatus(403)
    },

    receive : asyncHandler(async(req : Request , res : Response) => {
        const signature = req.headers["x-hub-signature-256"] as string | undefined
        if(!verifySignature(req.rawBody!, signature)){
            return res.sendStatus(403);
        }

        res.sendStatus(200);

        const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        if(!message) return;

        const from = message.from as string;

        // Everything below runs after the ack above — WhatsApp already has its 200, so nothing
        // here can reach the client through the normal response cycle anymore. Any error from
        // here on must be caught and reported back to the sender over WhatsApp itself, rather
        // than bubbling up to errorHandler with no response left to send.
        try {
            let text: string;
            let inputMode: "voice" | "text";

            if (message.type === "text") {
                text = message.text.body as string;
                inputMode = "text";
            } else if (message.type === "audio") {
                try {
                    text = await transcribeWhatsAppVoiceNote(message.audio.id as string);
                    inputMode = "voice";
                } catch (err) {
                    console.error("WhatsApp voice transcription failed:", err);
                    await sendWhatsAppMessage(from, "Sorry, I couldn't understand that voice note. Please try again or type it instead.");
                    return;
                }
            } else {
                await sendWhatsAppMessage(from, "Sorry, I can only understand text messages or voice notes right now.");
                return;
            }

            const sender = await User.findOne({ phone: from, isActive: true });
            if (!sender) {
                await sendWhatsAppMessage(from, "This number isn't registered in Task Matrix. Ask an admin to add it to your profile first.");
                return;
            }

            const refereceDate = new Date();
            const extraction = await extractTaskFromText(text, refereceDate);
            const assignee = await resolveAssignee(extraction.assigneeName, extraction.department);
            const department = await departmentService.resolveByName(extraction.department);
            const dueDate = resolveDueDate(extraction.dueDateISO, text, refereceDate)
            const priority = priorityForCreatorRank(sender.rank ?? 5)

            const task = await taskService.createFromSmartInput(
                {
                    title : extraction.title,
                    context : extraction.context || undefined,
                    category : extraction.category,
                    priority,
                    dueDate : dueDate.toISOString(),
                    assigneeId : assignee?._id?.toString(),
                    departmentId : department?._id?.toString(),
                    assigneeRaw : extraction.assigneeName || undefined,
                    departmentRaw : extraction.department || undefined,
                    confidence : extraction.confidence,
                    rawInput : text,
                    inputMode,
                    channel : "whatsapp",
                    wonBy : extraction.wonBy,

                },
                { sub : sender._id.toString(), role : sender.role, departmentId : sender.departmentId?.toString()},
            );

            const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName ?? ""}`.trim() : "unassigned";
            await sendWhatsAppMessage(
                from,
                `Task Created: ${task.title}\nAssigned to: ${assigneeName}\nDue: ${dueDate.toLocaleDateString()}\nPriority: ${priority}`,
            );

        }catch(err){
            console.error("WhatsApp task creation failed:" ,err);
            await sendWhatsAppMessage(from, "Sorry, something wend wrong creating that task. Please try again or add it manually.")

        }
    })
}