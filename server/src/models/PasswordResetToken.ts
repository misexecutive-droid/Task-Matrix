import { Schema, model } from "mongoose"

// Schema (shape) for a PasswordResetToken document - a short-lived, single-use token issued when
// a user requests a password reset. Same hashed-token pattern as RefreshToken.ts: we only ever
// store a hash of the token, never the raw value, so a database leak alone can't be used to reset
// anyone's password.
const passwordResetTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }, // set once the token has actually been used to reset a password
},
    { timestamps: true },
)

export const PasswordResetToken = model('PasswordResetToken', passwordResetTokenSchema);
