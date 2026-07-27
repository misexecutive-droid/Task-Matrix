import { Schema, model } from "mongoose"

// A single message in a ticket's comment thread — visible to everyone who can already view the
// ticket (raiser, assignee, admin, manager, PC), one shared conversation rather than per-role
// scoped notes. Permission to post is enforced in ticketComment.service.ts by reusing the same
// visibility rule as viewing the ticket itself.

const ticketCommentSchema = new Schema(
    {
        body: { type: String, required: true, trim: true },
        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

ticketCommentSchema.virtual("author", {
    ref: "User",
    localField: "authorId",
    foreignField: "_id",
    justOne: true,
})

export const TicketComment = model("TicketComment", ticketCommentSchema)
