import { Router } from "express"
import { whatsappController } from "./whatsapp.controller.js"

export const whatsappRouter = Router()


whatsappRouter.get("/webhook", whatsappController.verify);
whatsappRouter.post("/webhook", whatsappController.receive);