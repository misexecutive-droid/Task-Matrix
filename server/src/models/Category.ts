import { Schema , model } from "mongoose"

// Schema (shape) for a Category document
const categorySchema = new Schema(
    {
        name : { type : String, required : true, unique : true, trim : true}, // category name, must be unique
        isActive : { type : Boolean  , default : true}, // soft-disable flag instead of deleting the category
        departmentId : { type : Schema.Types.ObjectId, ref : "Department" , required :true },
        assigneeIds : [{ type : Schema.Types.ObjectId, ref : "User"}],
        tatHours : { type : Number, default : null}
    },
    // adds createdAt/updatedAt automatically, and makes sure virtual fields (like `id`) show up in JSON output
    { timestamps : true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// The Mongoose Model used to query/create/update Category documents
export const Category = model('Category' , categorySchema)