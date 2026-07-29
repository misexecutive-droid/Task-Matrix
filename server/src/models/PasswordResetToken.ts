import { Schema, model } from "mongoose"

const passwordResetTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }, // set once the token has actually been used to reset a password
},
    { timestamps: true },
)

export const PasswordResetToken = model('PasswordResetToken', passwordResetTokenSchema);
