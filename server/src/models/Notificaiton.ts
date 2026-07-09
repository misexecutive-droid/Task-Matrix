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
        isRead : { type : Boolean , default : false} // whether the recipient has seen/opened this notification yet
    },
    { timestamps : true}, // adds createdAt/updatedAt automatically (no toJSON/toObject virtuals set here)
)

// The Mongoose Model used to query/create/update Notification documents.
// Note the exported name "Notification" is spelled correctly even though the filename is not.
export const Notification = model("Notification" , notificationSchema)
