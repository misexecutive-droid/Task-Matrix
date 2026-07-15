import { Schema , model } from "mongoose"

// Schema (shape) for a single ChecklistItem document (one line item inside a Checklist)
const ChecklistItemSchema = new Schema(
    {
        label : { type : String , required : true , trim : true}, // the text describing this checklist item
        isDone : { type : Boolean , default : false}, // whether this item has been completed
        // assigneeId: optional reference to the User responsible for this specific item
        assigneeId : { type : Schema.Types.ObjectId , ref : "User" , default : null},
        dueAt : { type : Date , default : null}, // optional deadline for this item
        completedAt : { type : Date , default : null}, // when the item was actually marked done (set automatically below)
        // checklistId: reference to the parent Checklist this item belongs to.
        // index: true speeds up queries that look up items by checklistId.
        checklistId : { type : Schema.Types.ObjectId , ref : "Checklist" , required : true , index : true},

        requiredImageCount : { type : Number , default : 0 , min : 0},
        maxImageCount : { type : Number , default : null , min : 0},
        requiresLivePhoto : { type : Boolean , default : false},
        remarks : { type : String , default : null },
    },
    { timestamps : true, toJSON : { virtuals : true} , toObject : { virtuals : true} }
)

ChecklistItemSchema.virtual("images", {
    ref : "ChecklistImage",
    localField : "_id",
    foreignField : "checklistItemId",
})

// pre('save') hook: runs automatically right before saving. Whenever isDone changes,
// this sets completedAt to "now" if it was just marked done, or clears it back to null
// if it was un-done. This keeps completedAt in sync with isDone without extra code elsewhere.
ChecklistItemSchema.pre("save" , function(next){
    if(this.isModified("isDone")){
        this.completedAt = this.isDone ? new Date() : null ;

    }
    next(); // continue with the rest of the save process
})

// The Mongoose Model used to query/create/update ChecklistItem documents
export const ChecklistItem = model("ChecklistItem" , ChecklistItemSchema)