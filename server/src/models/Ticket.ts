import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose"

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export type Priority = (typeof PRIORITIES)[number]

export const ASSIGNMENT_MODES = ["AUTO", "MANUAL"] as const
export type AssignmentMode = (typeof ASSIGNMENT_MODES)[number]

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "IN_REVIEW", "CLOSED", "ON_HOLD"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number]

const ticketSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        status: { type: String, enum: TICKET_STATUSES, default: 'OPEN' },
        priority: { type: String, enum: PRIORITIES, default: 'MEDIUM' },
        assignmentMode: { type: String, enum: ASSIGNMENT_MODES, default: 'MANUAL' },
        tatHours: { type: Number, default: null },
        tatDueAt: { type: Date, default: null },
        isOverdue: { type: Boolean, default: false },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },


)

ticketSchema.virtual("assignee" , {
    ref : "User",
    localField : "assigneeId",
    foreignField : "_id",
    justOne : true
})

ticketSchema.virtual("checklists", {
    ref : "Checklist",
    localField : "_id",
    foreignField : "ticketId"
})

ticketSchema.pre("save" , function (next){
    if(this.isModified("tatHours")){
        this.tatDueAt = this.tatHours ? new Date(Date.now() + this.tatHours * 60 * 60 * 1000) : null ;
        this.isOverdue = false;
    }
    next()
})

export type TicketDoc = HydratedDocument<InferSchemaType<typeof ticketSchema>>;
export const Ticket = model("Ticket" , ticketSchema)
