import { Schema , model} from 'mongoose'

// Schema (shape) for a Project document
const projectSchema = new Schema(
    {
        name : { type : String , required : true , trim : true},
        description : { type : String , trim : true , default: ''},
        // onwerId: intended to be a reference to the User who owns this project.
        // note: this looks like it might not do what's intended - it's typed as String here
        // instead of Schema.Types.ObjectId like other reference fields, even though it has
        // a "ref" set, and the field name itself is spelled "onwerId" instead of "ownerId".
        onwerId : { type : String, ref : "User" , required : true},
        // memberIds: an array of references to User documents (the project's team members)
        memberIds : [{ type : Schema.Types.ObjectId, ref : "User"}],
    },
    { timestamps : true}, // adds createdAt/updatedAt automatically (no toJSON/toObject virtuals set here)
)

// The Mongoose Model used to query/create/update Project documents
export const Project = model("Project" , projectSchema)