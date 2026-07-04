import type { Request , Response} from 'express'
import { userService } from './user.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { success } from 'zod/v4'

export const userController = {
    list : asyncHandler ( async (_req : Request , res : Response) => {
        const users = await userService.list()
        res.json({ success : true , data : users})
    }),

    getOne : asyncHandler(async (req : Request , res : Response) => {
        const user = await userService.getById(req.params.id);
        res.json({ success : true , data : user})
    }),

    create : asyncHandler(async (req : Request , res : Response) => {
        const user = await userService.create(req.body);
        res.status(201).json({ success : true , data : user})
    }),

    update : asyncHandler(async (req : Request , res : Response) => {
        const user = await userService.update(req.params.id , req.body , req.user!.sub);
        res.json({ success : true , data : user})
    }),

    remove : asyncHandler(async (req : Request . res : Response) =>{
        
    })
}