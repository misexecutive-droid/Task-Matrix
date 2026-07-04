import { Schema, model } from "mongoose"

const checklistSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistSchema.virtual("items" , {
    ref : "ChecklistItem",
    localField :"_id",
    foreignField : "checklistId"
})

export const Checklist = model("Checklist" , checklistSchema)