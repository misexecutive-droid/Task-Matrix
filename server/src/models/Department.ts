import { Schema, model } from "mongoose"

const departmentSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        isActive: { type: Boolean, default: true },
        // Optional home store this department belongs to (e.g. "Sales @ Downtown"). Left null for
        // a department that isn't tied to one specific store. Lets a MANAGER's (department-scoped)
        // and a SENIOR's (store-scoped) reports resolve into each other — see
        // server/src/utils/reportScope.ts's resolveStoreIdForDepartment/resolveDepartmentIdsForStore.
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const Department = model("Department", departmentSchema)