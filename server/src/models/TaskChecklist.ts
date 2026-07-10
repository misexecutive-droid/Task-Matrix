import { Schema , model } from "mongoose"

const taskChecklistSchema = new Schema({
    title : { type : String, required : true, trim:true},
    taskId : { type : Schema.Types.ObjectId, ref : "Task", required : true}
},
{timestamps : true , toJSON : { virtuals : true}, toObject : {virtuals : true}},
)

//Virtual field "items" ; not stored directly on this document. When populated, Mongoose
// find all TaskChecklistItem documents whose taskChecklistId matched this checklist's own _id.

taskChecklistSchema.virtual("items" , {
    ref : "TaskChecklistItem",
    localField : "_id",
    foreignField : "taskChecklistId",
})

export const TaskChecklist = model("TaskChecklist" , taskChecklistSchema)