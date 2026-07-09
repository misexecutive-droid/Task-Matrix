import { Schema , model } from "mongoose"

// Schema (shape) for a Store document
const storeSchema = new Schema(
    {
        name : { type : String , required : true, unique : true , trim :true}, // store name, must be unique
        code : { type : String, trim : true , uppercase : true }, // short code for the store, auto-uppercased
        address : { type : String , trim : true}, // optional street address
        isActive : { type : Boolean , default : true} // soft-disable flag instead of deleting the store
    },
    // adds createdAt/updatedAt automatically, and makes sure virtual fields (like `id`) show up in JSON output
    { timestamps : true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// The Mongoose Model used to query/create/update Store documents
export const Store = model('Store' , storeSchema)