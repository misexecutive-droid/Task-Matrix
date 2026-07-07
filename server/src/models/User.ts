
import { Schema, model, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from "bcryptjs";

export const ROLES = ["ADMIN", "MANAGER", "AGENT", "USER"] as const;
export type Role = (typeof ROLES)[number];

export interface UserMethods {
    comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, trim: true },
        role: { type: String, enum: ROLES, default: "USER" },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true },
);


interface UserMethodsContext {
    _plainPassword?: string;
    passwordHash: string;
}

userSchema.virtual('password').set(function (this: UserMethodsContext, plain: string) {
    this._plainPassword = plain;
});

userSchema.pre('validate', async function (this: UserMethodsContext, next) {
    const plain = this._plainPassword;
    if (!plain) return next();
    
    this.passwordHash = await bcrypt.hash(plain, 12); 
    next();
});

userSchema.methods.comparePassword = function (this: UserMethodsContext, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
};

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>, UserMethods>;

export const User = model<InferSchemaType<typeof userSchema>, Model<InferSchemaType<typeof userSchema>, {}, UserMethods>>('User', userSchema);
