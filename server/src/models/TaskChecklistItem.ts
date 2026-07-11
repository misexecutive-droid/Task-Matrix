import { Schema , model } from "mongoose"
import { string } from "zod/v4"

const taskChecklistItemSchema = new Schema(
    {
        label : { type : String, required : true, trim : true},
        isDone : { type : Boolean , default : false},
        assigneeId : { type : Schema.Types.ObjectId , ref : "User", default : null},
        deuAt : { type : Date , default : null},
        completedAt : { type : Date , default : null},
        TaskChecklistId : { type : Schema.Types.ObjectId, ref : "TaskChecklist" , required : true, index:true},

        requiredImageCount : { type : Number , default : 0 , min : 0},
        requiresLivePhoto : { type : Boolean , default : false},
    },
    {
        timestamps : true, toJSON : { virtuals : true} , toObject : { virtuals  : true}
    }
)

taskChecklistItemSchema.virtual("images", {
    ref : "TaskImage",
    localField : "_id",
    foreignField : "taskChecklistItemId",
})

taskChecklistItemSchema.pre("save", function(next){
    if(this.isModified("isDone")){
        this.completedAt = this.isDone ? new Date() : null;

    }
    next()
})

export const TaskChecklistItem = model("TaskChecklistItem", taskChecklistItemSchema)