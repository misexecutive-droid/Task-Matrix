import { Schema, model } from "mongoose"

// Schema (shape) for a Department document
const departmentSchema = new Schema(
    {
        // name: required, must be unique (no two departments with the same name), trims whitespace
        name: { type: String, required: true, unique: true, trim: true },
        isActive: { type: Boolean, default: true } // used to "soft disable" a department instead of deleting it
    },
    // timestamps: true adds createdAt/updatedAt automatically.
    // toJSON/toObject virtuals: true makes sure virtual fields (like the `id` string version of `_id`)
    // actually appear when this document gets converted to JSON for API responses.
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// The actual Mongoose Model - used elsewhere to query/create/update Department documents
export const Department = model("Department", departmentSchema)