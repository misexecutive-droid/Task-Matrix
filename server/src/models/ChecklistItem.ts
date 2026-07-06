import { Schema , model } from "mongoose"

const ChecklistItemSchema = new Schema(
    {
        label : { type : String , required : true , trim : true},
        isDone : { type : Boolean , default : false},
        assigneeId : { type : Schema.Types.ObjectId , ref : "User" , default : null},
        dueAt : { type : Date , default : null},
        completedAt : { type : Date , default : null},
        checklistId : { type : Schema.Types.ObjectId , ref : "Checklist" , required : true , index : true}
    },
    { timestamps : true }
)

ChecklistItemSchema.pre("save" , function(next){
    if(this.isModified("isDone")){
        this.completedAt = this.isDone ? new Date() : null ;

    }
    next();
})

export const ChecklistItem = model("ChecklistItem" , ChecklistItemSchema)