
import { Schema, model, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from "bcryptjs"; // library used to securely hash and compare passwords

// The list of allowed roles a user can have. "as const" locks these strings
// so TypeScript treats them as an exact set of values, not just "string".
export const ROLES = ["ADMIN", "MANAGER", "AGENT", "USER", "PC"] as const;
// A TypeScript type built from the ROLES array above (so Role can only ever be one of those 4 strings)
export type Role = (typeof ROLES)[number];

// Extra methods we attach to User documents (beyond the normal Mongoose fields).
// This lets TypeScript know that every User document also has a comparePassword() function.
export interface UserMethods {
    comparePassword(plain: string): Promise<boolean>;
}

// This defines the shape ("schema") of a User document in MongoDB - basically the table columns.
const userSchema = new Schema(
    {
        // email: must be text, is mandatory, must be unique across all users,
        // gets lowercased and has whitespace trimmed automatically before saving
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        // passwordHash: the hashed (encrypted) password is stored here, never the plain password.
        // select: false means this field is hidden by default when you query users (extra safety).
        passwordHash: { type: String, required: true, select: false },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, trim: true }, // optional last name
        // role: only allowed to be one of the ROLES values, defaults to "USER" if not given
        role: { type: String, enum: ROLES, default: "USER" },
        // departmentId: a reference (like a foreign key) pointing to a Department document's _id.
        // "ref: 'Department'" tells Mongoose which model to look in when you "populate" this field.
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
        // storeId: same idea, but references a Store document
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
        isActive: { type: Boolean, default: true } // lets you "soft disable" a user without deleting them
    },
    // timestamps: true -> Mongoose automatically adds/maintains createdAt and updatedAt fields
    // toJSON/toObject virtuals: true -> without this, "virtual" fields (like the auto-generated `id`
    // string version of `_id`, or any custom virtual() fields) would NOT show up when this document
    // is converted to JSON for an API response. This exact issue caused a real bug earlier in this
    // project (the `id` field silently missing from responses), so it's important these are set.
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);


// A helper type describing the extra, non-schema properties we use internally
// while hashing the password (not something stored permanently in the DB).
interface UserMethodsContext {
    _plainPassword?: string;
    passwordHash: string;
}

// A "virtual" field called "password". It's not stored in the database at all -
// it's a temporary/computed field. Here we only define a "setter": whenever someone
// does `user.password = "something"`, it stores that plain text temporarily on
// `_plainPassword` so the pre('validate') hook below can hash it.
userSchema.virtual('password').set(function (this: UserMethodsContext, plain: string) {
    this._plainPassword = plain;
});

// pre('validate') hook: this function automatically runs BEFORE Mongoose validates
// the document (which happens before saving). It's used here to turn the plain-text
// password into a secure hash before anything gets written to the database.
userSchema.pre('validate', async function (this: UserMethodsContext, next) {
    const plain = this._plainPassword;
    if (!plain) return next(); // if no plain password was set, skip hashing and continue

    // bcrypt.hash scrambles the plain password using 12 "rounds" of salting/hashing,
    // making it very hard to reverse-engineer the original password.
    this.passwordHash = await bcrypt.hash(plain, 12);
    next(); // continue on to the next step in Mongoose's validation/save process
});

// Instance method: lets you call `someUserDoc.comparePassword("typedPassword")`
// to check if a plain-text password matches the stored hash, without ever
// decrypting the hash (bcrypt.compare re-hashes and compares safely).
userSchema.methods.comparePassword = function (this: UserMethodsContext, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
};

// TypeScript type helpers:
// - InferSchemaType<typeof userSchema> automatically figures out the TS type of a plain User object
//   from the schema definition above (so we don't have to write it twice).
// - HydratedDocument<...> wraps that type as a "live" Mongoose document (with methods like .save()).
// Combining these with UserMethods gives us a fully-typed User document type to use elsewhere in the app.
export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>, UserMethods>;

// Creates the actual Mongoose Model named "User" (this is what you import elsewhere
// to run queries like User.find(), User.create(), etc.). The generic types wire up
// the inferred schema type plus our custom UserMethods so TypeScript knows about comparePassword().
export const User = model<InferSchemaType<typeof userSchema>, Model<InferSchemaType<typeof userSchema>, {}, UserMethods>>('User', userSchema);