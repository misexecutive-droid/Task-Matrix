import type { Request, Response } from "express";
import { extractTaskFromText, resolveAssignee, resolveDueDate, priorityForCreatorRank } from "./providers/task.ai.service.js";
import { confirmSmartTaskSchema } from "../task.validation.js";
import { taskService } from "../task.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { User } from "../../../models/User.js";

// export async function parseSmartInput(req: Request, res: Response) {
//     const { text } = req.body as { text: string };
//     if (!text?.trim()) {
//         return res.status(400).json({ message: "text is required" });
//     }

//     const referenceDate = new Date();
//     const extraction = await extractTaskFromText(text, referenceDate);

//     const [assignee, creator] = await Promise.all([
//         resolveAssignee(extraction.assigneeName, extraction.department),
//         User.findById(req.user!.sub),
//     ]);

//     res.json({
//         title: extraction.title,
//         context: extraction.context,
//         category: extraction.category,
//         assignee: assignee ? { id: assignee._id, name: `${assignee.firstName} ${assignee.lastName ?? ""}`.trim() } : null,
//         assigneeRaw: extraction.assigneeName,
//         departmentRaw: extraction.department,
//         dueDate: resolveDueDate(extraction.dueDateISO, text, referenceDate),
//         priority: priorityForCreatorRank(creator?.rank ?? 5),
//         confidence: extraction.confidence,
//     });
// }

export const taskAiController = {
    parse : asyncHandler ( async (req : Request , res : Response) => {
        const { text } = req.body as { text : string};
        if(!text?.trim()){
            return res.status(400).json({ message : "text is required"})
        }

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
    })
}
