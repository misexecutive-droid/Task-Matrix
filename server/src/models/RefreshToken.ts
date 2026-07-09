import { Schema, model } from "mongoose"

// Schema (shape) for a RefreshToken document - used to keep users logged in
// without needing them to re-enter their password every time their access token expires
const refreshTokenSchema = new Schema({
    // userId: reference to the User this refresh token belongs to. index: true speeds up
    // lookups like "find all refresh tokens for this user".
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // tokenHash: the hashed version of the refresh token string (never store the raw token),
    // and it must be unique so no two tokens collide.
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }, // when this token stops being valid
    revokedAt: { type: Date, default: null }, // set to a date if the token was manually invalidated (e.g. on logout)

},
    { timestamps: true }, // adds createdAt/updatedAt automatically

)

// The Mongoose Model used to query/create/update RefreshToken documents
export const RefreshToken = model('RefreshToken' , refreshTokenSchema);