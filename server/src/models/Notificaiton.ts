import { Schema , model } from  "mongoose"

// Schema (shape) for a Notification document - a message sent to a specific user
const notificationSchema = new Schema(
    {
        // recipientId: reference to the User who should receive this notification.
        // index: true speeds up queries like "get all notifications for this user".
        recipientId : { type : Schema.Types.ObjectId, ref: "User" , required : true , index : true},
        type : { type : String , required : true}, // a category/kind of notification, e.g. "TICKET_ASSIGNED"
        title : { type : String , required :true}, // short heading text shown to the user
        message : { type : String, required : true }, // the full notification text
        // ticketId: optional reference back to the Ticket this notification is about (if any)
        ticketId : { type : Schema.Types.ObjectId , ref : "Ticket" , default : null},
        // taskId: optional reference back to the Task this notification is about (if any)
        taskId : { type : Schema.Types.ObjectId , ref : "Task" , default : null},
        // checklistInstanceId: optional reference back to the recurring ChecklistInstance this
        // notification is about (if any) — e.g. "awaiting your verification" / approved / rejected.
        checklistInstanceId : { type : Schema.Types.ObjectId , ref : "ChecklistInstance" , default : null},
        isRead : { type : Boolean , default : false} // whether the recipient has seen/opened this notification yet
    },
    // toJSON/toObject virtuals: true -> serializes the "id" string virtual (alias for _id) into API
    // responses, matching every other model (Department, User, Ticket, etc.) - the client reads
    // notification.id, not notification._id.
    { timestamps : true, toJSON : { virtuals : true }, toObject : { virtuals : true } },
)

// The Mongoose Model used to query/create/update Notification documents.
// Note the exported name "Notification" is spelled correctly even though the filename is not.
export const Notification = model("Notification" , notificationSchema)
