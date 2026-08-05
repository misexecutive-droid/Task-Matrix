import { Schema , model } from "mongoose"

const categorySchema = new Schema(
    {
        name : { type : String, required : true, unique : true, trim : true}, // category name, must be unique
        isActive : { type : Boolean  , default : true}, // soft-disable flag instead of deleting the category
        departmentId : { type : Schema.Types.ObjectId, ref : "Department" , required :true },
        assigneeIds : [{ type : Schema.Types.ObjectId, ref : "User"}],
        tatHours : { type : Number, default : null}
    },
    { timestamps : true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const Category = model('Category' , categorySchema)