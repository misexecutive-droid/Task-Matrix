import { Schema , model} from 'mongoose'

const projectSchema = new Schema(
    {
        name : { type : String , required : true , trim : true},
        description : { type : String , trim : true , default: ''},
        onwerId : { type : String, ref : "User" , required : true},
        memberIds : [{ type : Schema.Types.ObjectId, ref : "User"}],
    },
    { timestamps : true},
)

export const Project = model("Project" , projectSchema)