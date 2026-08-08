import { TicketComment } from "../../models/TicketComment.js"
import { ticketService } from "../tickets/ticket.service.js"
import { emitTicketEvent } from "../../sockets/ticketEvent.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateCommentInput } from "./ticketComment.validation.js"

export const ticketCommentService = {

    async create(ticketId: string, input: CreateCommentInput, user: AccessTokenPayload) {
        const ticket = await ticketService.getById(ticketId, user)

        const comment = await TicketComment.create({
            body: input.body,
            ticketId,
            authorId: user.sub,
        })

        const populated = await comment.populate({ path: "author", select: "email firstName role" })

        emitTicketEvent("ticket:updated", {
            userId: (ticket as any).userId?.toString(),
            assigneeId: (ticket as any).assigneeId?.toString() ?? null,
            departmentId: (ticket as any).departmentId?.toString() ?? null,
            storeId: (ticket as any).storeId?.toString() ?? null,
        }, ticket)

        return populated
    },
}
