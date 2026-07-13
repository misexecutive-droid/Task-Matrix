import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose"

// Allowed priority levels for a ticket, locked as an exact set of string values
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export type Priority = (typeof PRIORITIES)[number] // TS type built from the array above

// Whether a ticket gets assigned automatically by the system or manually by a person
export const ASSIGNMENT_MODES = ["AUTO", "MANUAL"] as const
export type AssignmentMode = (typeof ASSIGNMENT_MODES)[number]

// Allowed lifecycle statuses a ticket can be in
export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "IN_REVIEW", "CLOSED", "ON_HOLD"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number]

// Schema (shape) for a Ticket document
const ticketSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        // status/priority/assignmentMode: restricted to the enum lists above, with sensible defaults
        status: { type: String, enum: TICKET_STATUSES, default: 'OPEN' },
        priority: { type: String, enum: PRIORITIES, default: 'MEDIUM' },
        assignmentMode: { type: String, enum: ASSIGNMENT_MODES, default: 'MANUAL' },
        tatHours: { type: Number, default: null }, // "Turn-Around-Time" in hours allowed to resolve the ticket
        tatDueAt: { type: Date, default: null }, // the actual deadline date/time computed from tatHours
        isOverdue: { type: Boolean, default: false }, // flag for whether the ticket has passed its due date
        closedAt: { type: Date, default: null }, // when the ticket actually closed, used for TAT reporting
        // userId: reference to the User who raised/created this ticket
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        // assigneeId: reference to the User this ticket is currently assigned to (optional)
        assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        // storeId/categoryId/departmentId: optional references linking this ticket to other collections
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    },
    // timestamps: true adds createdAt/updatedAt automatically.
    // toJSON/toObject virtuals: true is required so virtual fields defined below (assignee, checklists,
    // raisedBy, and the auto `id` field) actually get included when this doc is sent back as JSON.
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },


)

// Virtual field "assignee": NOT stored in the database directly. Instead, when you
// "populate('assignee')", Mongoose looks up the User whose _id matches this ticket's
// assigneeId, and attaches it here. justOne: true means we expect a single User, not an array.
ticketSchema.virtual("assignee" , {
    ref : "User",
    localField : "assigneeId",
    foreignField : "_id",
    justOne : true
})

// Virtual field "checklists": another populate-based virtual. This one goes the "other way" -
// it finds all Checklist documents whose ticketId matches this ticket's own _id.
// (No justOne, so this returns an array of checklists.)
ticketSchema.virtual("checklists", {
    ref : "Checklist",
    localField : "_id",
    foreignField : "ticketId"
})

// pre('save') hook: runs automatically right before a ticket is saved to the database.
// Here, whenever tatHours has been changed, it recalculates tatDueAt (the deadline)
// by adding tatHours worth of milliseconds to the current time, and resets isOverdue to false
// since the deadline just changed.
ticketSchema.pre("save" , function (next){
    if(this.isModified("tatHours")){
        this.tatDueAt = this.tatHours ? new Date(Date.now() + this.tatHours * 60 * 60 * 1000) : null ;
        this.isOverdue = false;
    }
    next() // continue with the rest of the save process
})

// Virtual field "raisedBy": populate-based virtual that looks up the User who created
// this ticket (via userId), similar to "assignee" above but for the ticket's creator.
ticketSchema.virtual("raisedBy" , {
    ref : "User",
    localField : "userId",
    foreignField : "_id",
    justOne : true
})

// TypeScript type for a fully-loaded Ticket document (inferred from the schema + wrapped as a live Mongoose doc)
export type TicketDoc = HydratedDocument<InferSchemaType<typeof ticketSchema>>;
// The Mongoose Model used to query/create/update Ticket documents
export const Ticket = model("Ticket" , ticketSchema)