import { Schema , model } from "mongoose";
const auditLogSchema = new Schema(
    {
        entityType : {type : String , required : true},
        entityId : { type : Schema.Types.ObjectId , required : true},
        action : { type : String , required : true},
        actorId : { type : String, required : true },
        before : { type : Schema.Types.Mixed , default : null},
        after : { type  : Schema.Types.Mixed , default : null}
    
    },

    { timestamps : true}
)

auditLogSchema.index({ entityType : 1 , entityId : 1})
export const AuditLog = model("AuditLog" , auditLogSchema)