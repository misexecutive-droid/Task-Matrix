import { Schema , model } from "mongoose";
// Schema (shape) for an AuditLog document - a record of "something changed" for tracking/history purposes
const auditLogSchema = new Schema(
    {
        entityType : {type : String , required : true}, // what kind of thing changed, e.g. "Ticket", "User"
        entityId : { type : Schema.Types.ObjectId , required : true}, // the _id of the specific document that changed
        action : { type : String , required : true}, // what happened, e.g. "CREATE", "UPDATE", "DELETE"
        // actorId: who performed the action. note: this is a String here rather than an ObjectId
        // reference (unlike other "...Id" fields elsewhere), so it isn't linked to the User model via ref.
        actorId : { type : String, required : true },
        // before/after: Schema.Types.Mixed means "any type of data is allowed here" - used to store
        // a snapshot of the document's data before and after the change, for comparison/history.
        before : { type : Schema.Types.Mixed , default : null},
        after : { type  : Schema.Types.Mixed , default : null}

    },

    { timestamps : true} // adds createdAt/updatedAt automatically, so we know when each log entry happened
)

// Creates a database index on entityType + entityId together, which makes it much faster
// to look up "all audit log entries for this specific entity" later on.
auditLogSchema.index({ entityType : 1 , entityId : 1})
// The Mongoose Model used to query/create AuditLog documents
export const AuditLog = model("AuditLog" , auditLogSchema)