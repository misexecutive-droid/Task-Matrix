import type { Request, Response } from "express";
import { extractTaskFromText, resolveAssignee, resolveDueDate, priorityForCreatorRank } from "./providers/task.ai.service.js";
import { confirmSmartTaskSchema, parseTaskTextSchema } from "../task.validation.js";
import { taskService } from "../task.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { User } from "../../../models/User.js";
import { transcribeVoiceNote } from "../../whatsapp/transcription.service.js";
import { AppError } from "../../../utils/AppError.js";

export const taskAiController = {
    parse : asyncHandler ( async (req : Request , res : Response) => {
        const { text } = parseTaskTextSchema.parse(req.body);

        const referenceDate = new Date();
        const extraction = await extractTaskFromText(text, referenceDate)
        
        const [ assignee, creator ] = await Promise.all([
            resolveAssignee(extraction.assigneeName, extraction.department),
            User.findById(req.user!.sub)
        ]);

        res.json({
            title: extraction.title,
            context: extraction.context,
            category: extraction.category,
            assignee: assignee ? { id: assignee._id, name: `${assignee.firstName} ${assignee.lastName ?? ""}`.trim() } : null,
            assigneeRaw: extraction.assigneeName,
            departmentRaw: extraction.department,
            dueDate: resolveDueDate(extraction.dueDateISO, text, referenceDate),
            priority: priorityForCreatorRank(creator?.rank ?? 5),
            confidence: extraction.confidence,
            wonBy: extraction.wonBy,
            rawInput: text,
        })
    }),

    create : asyncHandler(async (req : Request , res : Response) => {
        const input = confirmSmartTaskSchema.parse(req.body);
        const task = await taskService.createFromSmartInput(input, req.user!);
        res.status(201).json(task)
    }),

    // Web Smart Add's voice recorder — transcribes a browser-recorded clip and hands back plain
    // text, which the client then feeds through the exact same /ai/parse flow typed text uses.
    transcribe : asyncHandler(async (req : Request , res : Response) => {
        if (!req.file) {
            throw AppError.badRequest("audio file is required")
        }

        const transcript = await transcribeVoiceNote(req.file.buffer, req.file.mimetype);
        if (!transcript.trim()) {
            throw AppError.unprocessable("Could not transcribe audio")
        }

        res.json({ transcript })
    }),
}
