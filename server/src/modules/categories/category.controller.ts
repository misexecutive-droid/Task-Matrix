import { type Request, type Response } from "express";
import { categoryService } from "./category.service.js";
import { createCategorySchema , updateCategorySchema } from "./category.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const categoryController = {
    list : asyncHandler(async (_req : Request , res : Response) => {
        const categories = await categoryService.list()
        res.json({ success : true, data : categories})
    }), 

    getOne : asyncHandler(async(req : Request, res : Response) => {
        const category = await categoryService.getById(req.params.id)
        res.json({ success : true , data : category})
    }),

    create : asyncHandler(async(req : Request, res : Response) => {
        const input = createCategorySchema.parse(req.body)
        const category = await categoryService.create(input)
        res.status(201).json({ success : true , data : category})
    }),

    update : asyncHandler(async (req : Request , res : Response) => {
        const input = updateCategorySchema.parse(req.body)
        const category = await categoryService.update(req.params.id, input)
        res.json({ success : true , data : category})
    }),

    remove : asyncHandler(async (req : Request , res : Response) => {
        await categoryService.remove(req.params.id)
        res.json({ success : true, data : { deleted : true}})
    })

}