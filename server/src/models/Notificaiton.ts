import { Schema , model } from  "mongoose"

const notificationSchema = new Schema(
    {
        recipientId : { type : Schema.Types.ObjectId, ref: "User" , required : true , index : true},
        type : { type : String , required : true},
        title : { type : String , required :true},
        message : { }
    }
)