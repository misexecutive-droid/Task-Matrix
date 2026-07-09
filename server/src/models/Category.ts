import { Schema , model } from "mongoose"

// Schema (shape) for a Category document
const categorySchema = new Schema(
    {
        name : { type : String, required : true, unique : true, trim : true}, // category name, must be unique
        isActive : { type : Boolean  , default : true} // soft-disable flag instead of deleting the category
    },
    // adds createdAt/updatedAt automatically, and makes sure virtual fields (like `id`) show up in JSON output
    { timestamps : true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// The Mongoose Model used to query/create/update Category documents
export const Category = model('Category' , categorySchema)