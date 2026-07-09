import { Schema , model } from "mongoose"

const storeSchema = new Schema(
    {
        name : { type : String , required : true, unique : true , trim :true},
        code : { type : String, trim : true , uppercase : true },
        address : { type : String , trim : true},
        isActive : { type : Boolean , default : true}
    },
    { timestamps : true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const Store = model('Store' , storeSchema)