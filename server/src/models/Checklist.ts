import { Schema, model } from "mongoose"

// Schema (shape) for a Checklist document (a checklist belongs to one Ticket)
const checklistSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        // ticketId: reference (foreign-key-like link) to the Ticket this checklist belongs to
        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    },
    // timestamps: true adds createdAt/updatedAt automatically.
    // toJSON/toObject virtuals: true makes sure the "items" virtual below (and the auto `id` field)
    // actually appear when this document is converted to JSON for API responses.
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

// Virtual field "items": not stored directly on this document. When populated, Mongoose
// finds all ChecklistItem documents whose checklistId matches this checklist's own _id,
// and attaches them here as an array.
checklistSchema.virtual("items" , {
    ref : "ChecklistItem",
    localField :"_id",
    foreignField : "checklistId"
})

// The Mongoose Model used to query/create/update Checklist documents
export const Checklist = model("Checklist" , checklistSchema)