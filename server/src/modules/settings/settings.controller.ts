import { type Request, type Response } from "express";
import { settingsService } from "./settings.service.js";
import { updateSettingsSchema } from "./settings.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const settingsController = {
    //

    get : asyncHandler(async (_req : Request , res : Response) => {
        const settings = await settingsService.get()
        res.json({ success : true , data : settings})
    }),

    update : asyncHandler(async (req : Request , res : Response) => {
        const input = updateSettingsSchema.parse(req.body)
        const settings = await settingsService.update(input)
        res.json({ success : true, data : settings})
    })
}

