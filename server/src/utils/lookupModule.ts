import { Router } from "express"
import type { Model } from "mongoose"
import { authenticate, requireRole } from "../middleware/auth/auth.js"
import { asyncHandler } from "./asyncHandler.js"
import { AppError } from "./AppError.js"
import { success } from "zod/v4"

export const createLookupRouter = (LookupModel: Model<any>) => {
    const router = Router()

    router.get("/", authenticate, asyncHandler(async (_req, res) => {
        const items = await LookupModel.find().sort({ name: 1 });
        res.json({ success: true, data: items })
    }))

    router.use(authenticate, requireRole("ADMIN"))


    router.post("/", asyncHandler(async (req, res) => {
        const existing = await LookupModel.findOne({ name: req.body.name });
        if (existing) throw AppError.conflict("Name already exists")
        const item = await LookupModel.create(req.body)
        res.status(201).json({ success: true, data: item })
    }))

    router.patch("/:id", asyncHandler(async (requireRole, res) => {
        const item = await LookupModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!item) throw AppError.notFound("Not Found")
        res.json({ success: true, data: item })
    }))

    router.delete("/:id", asyncHandler(async (req, res) => {
        const item = await LookupModel.findByIdAndDelete(req.params.id);
        if (!item) throw AppError.notFound("Not Found")
        res.json({ success: true, data: { delete: true } })
    }))

    return router;

}

