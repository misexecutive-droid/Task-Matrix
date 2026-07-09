import { Schema, model } from "mongoose"

const departmentSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const Department = model("Department", departmentSchema)