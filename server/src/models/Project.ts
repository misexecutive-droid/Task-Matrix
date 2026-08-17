import { Schema , model} from 'mongoose'

// Schema (shape) for a Project document
const projectSchema = new Schema(
    {
        name : { type : String , required : true , trim : true},
        description : { type : String , trim : true , default: ''},
        ownerId : { type : Schema.Types.ObjectId, ref : "User" , required : true},
        memberIds : [{ type : Schema.Types.ObjectId, ref : "User"}],
    },
    { timestamps : true}, // adds createdAt/updatedAt automatically (no toJSON/toObject virtuals set here)
)

// The Mongoose Model used to query/create/update Project documents
export const Project = model("Project" , projectSchema)