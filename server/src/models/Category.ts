import { Schema , model } from "mongoose"

const categorySchema = new Schema(
    {
        name : { type : String, required : true, unique : true, trim : true},
        isActive : { type : Boolean  , default : true}
    },
    { timestamps : true}
)

export const Category = model('Category' , categorySchema)