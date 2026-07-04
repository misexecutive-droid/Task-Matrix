import { response, type Request , type Response } from "express"
import { ticketService } from "./ticket.service.js"
import { createTicketSchema , paginatioinSchema, updateTicketSchema } from "./ticket.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { success } from "zod/v4"

export const ticketController = {
    list : asyncHandler( async ( req : Request , res : Response) => {
        const { page , limit } = paginatioinSchema.parse(req.query);
        const result = await ticketService.list(req.user!, page , limit)
        res.json({ success : true , ...result})
    }),

    getOne : asyncHandler(async (req : Request , res : Response) => {
        const ticket = await ticketService.getById(req.params.id , req.user!);
        res.json({ success : true , data : ticket})
    }),

    create : asyncHandler( async (req : Request , res : Response) => {
        const input = createTicketSchema.parse(req.body);
        const ticket = await ticketService.create(input , req.user!)
        res.status(201).json({ success : true , data : ticket})
    }),

    update : asyncHandler ( async (req : Request , res : response) => {
        const input = updateTicketSchema.parse(req.body);
        const ticket = await ticketService.update(req.params.id , input , req.user!)
        res.json({ success : true , data : ticket})
    }),

    remove : asyncHandler ( async ( req : Request, res : Response) => {
        await ticketService.remove(req.params.id)
        res.json({ success : true , data : { deleted : true}})
    }),
}