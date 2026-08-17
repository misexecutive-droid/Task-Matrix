import { type Request , type Response } from "express"
import { ticketService } from "./ticket.service.js"
import { createTicketSchema , paginatioinSchema, updateTicketSchema , tatReportQuerySchema, verifyTicketSchema, statusUpdateSchema } from "./ticket.validation.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

export const ticketController = {
    list : asyncHandler( async ( req : Request , res : Response) => {
        const { page , limit, status, assigneeId } = paginatioinSchema.parse(req.query);
        const result = await ticketService.list(req.user!, page , limit, status, assigneeId)
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

    update : asyncHandler ( async (req : Request , res : Response) => {
        const input = updateTicketSchema.parse(req.body);
        const ticket = await ticketService.update(req.params.id , input , req.user!)
        res.json({ success : true , data : ticket})
    }),

   
    addStatusUpdate : asyncHandler ( async (req : Request , res : Response) => {
        const input = statusUpdateSchema.parse(req.body);
        const files = (req.files as Express.Multer.File[]) ?? [];
        const ticket = await ticketService.addStatusUpdate(req.params.id , input , files , req.user!)
        res.json({ success : true , data : ticket})
    }),

    verify : asyncHandler ( async (req : Request , res : Response) => {
        const input = verifyTicketSchema.parse(req.body);
        const ticket = await ticketService.verify(req.params.id , input , req.user!)
        res.json({ success : true , data : ticket})
    }),

    remove : asyncHandler ( async ( req : Request, res : Response) => {
        await ticketService.remove(req.params.id , req.user!)
        res.json({ success : true , data : { deleted : true}})
    }),

    tatReport : asyncHandler(async (req : Request , res : Response) => {
        const { groupBy, from , to} = tatReportQuerySchema.parse(req.query);
        const data = await ticketService.tatReport(groupBy, from, to);
        res.json({ success : true, data})
    })
}