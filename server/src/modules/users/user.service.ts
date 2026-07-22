import { User } from "../../models/User.js"
import { AppError } from "../../utils/AppError.js"
import { auditService } from "../audit/audit.service.js"
import { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js"

// The service layer holds the actual business logic and database queries. Routes/controllers
// call these functions; this is where the real rules live (like "you can't deactivate yourself").
export const userService = {
    async list() {
        // Fetch every user, newest first (`createdAt: -1` means descending order by creation date).
        return User.find().sort({ createdAt: -1 })
    },

    async getById(id: string) {
        const user = await User.findById(id)
        // If no user was found with that id, throw a standardized 404-style error instead of
        // silently returning nothing - this lets the controller/error middleware respond properly.
        if (!user) throw AppError.notFound('User not found');
        return user;
    },

    async create(input: CreateUserInput , actorId : string) {
        // Make sure nobody else is already registered with this email before creating a duplicate.
        const existing = await User.findOne({ email: input.email });
        if (existing) throw AppError.conflict('Email already registered')


        // Build a new (unsaved) User document from the input fields (email, firstName, role, etc).
        const user = new User({ ...input });
        // We deliberately set `.password` as a separate step rather than passing it in the object
        // above. On the User model, `password` is a "virtual" property with a custom setter -
        // assigning to it doesn't store the raw password directly. Instead, the model's
        // `pre('validate')` hook (defined on the User schema) hashes it before saving, so the
        // real password never ends up sitting in the database in plain text. `(user as any)` is
        // used here because TypeScript doesn't know about this virtual `password` setter on the
        // User type, so we cast to `any` to bypass the type check.
        (user as any).password = input.password;
        // Saving triggers Mongoose validation and the pre('validate') hashing hook mentioned above.
        await user.save()

        // Record an audit log entry so there's a trail of "who created this user and what it
        // looked like right after creation" - useful for admins reviewing account history later.
        await auditService.record({
            entityType : "User",
            entityId : user._id.toString(),
            action : "CREATE",
            actorId,
            after : { email : user.email, role : user.role, isActive : user.isActive}
        })
        return user;

    },

    async update(id: string, input: UpdateUserInput, actorId: string) {
        // Grab the "before" snapshot of the user so we can log what changed (for the audit trail).
        const before = await User.findById(id);
        if(!before) throw AppError.notFound("User not found")

        // Apply the update. `new: true` makes it return the UPDATED document (not the old one).
        // `runValidators: true` makes sure schema validation rules still run on this update
        // (e.g. required fields, enum checks on `role`, etc), since updates skip validation by default.
        const user = await User.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!user) throw AppError.notFound('User not found')

        // Log both the "before" and "after" state so admins can see exactly what changed and when.
        await auditService.record({
            entityType : "User",
            entityId : id ,
            action : "UPDATE",
            actorId ,
            before : { email : before.email, role : before.role, isActive : before.isActive},
            after : { email : user.email, role : user.role , isActive : user.isActive }
        })
        return user
    },

    async remove(id: string, actorId: string) {
        // `findByIdAndDelete` finds the user and removes it from the database in one step,
        // returning the document as it looked right before deletion (or null if not found).
        const user = await User.findByIdAndDelete(id);
        if (!user) throw AppError.notFound('User not found')

        // Record what was deleted (email/role) so there's a record of the account that existed,
        // even though the actual document is now gone from the main User collection.
        await auditService.record({
            entityType : "User",
            entityId : id,
            action : "DELETE",
            actorId,
            before : { email : user.email, role : user.role}
        })

        return user;
    },

    // This powers the "assignable users" dropdown/picker used when assigning a ticket to someone.
    // `user` here is the decoded token payload of whoever is logged in and asking for this list
    // (could be an ADMIN, MANAGER, or other role) - NOT necessarily an admin, since this endpoint
    // is reachable by any authenticated user (see user.routes.ts - it's placed before the
    // `requireRole('ADMIN')` gate).
    async listAssignable( user : AccessTokenPayload, departmentId?: string ) {
        // Start with the baseline rule: only show users who are currently active - there's no
        // point offering a deactivated user as someone to assign a ticket to.
        const filter: Record <string , unknown> = { isActive : true};
        if(departmentId){
            // If the caller explicitly asked for a specific department (e.g. they picked a
            // department filter in the UI), just scope the results to that department directly,
            // regardless of who is asking. This takes priority over any role-based scoping below.
            filter.departmentId = departmentId;
        } else if(user.role === "MANAGER"){
            // If no specific department was requested AND the caller is a MANAGER (not an admin),
            // we scope the results down instead of returning literally everyone. Managers should
            // typically only be assigning tickets to people in their own department/store, plus
            // themselves.
            // We build this as a Mongo `$or` list of conditions - a user matches if ANY of these are true:
            const or : Record<string , unknown>[] = [{_id : user.sub}];
            // 1) it's always fine to "assign" a ticket to yourself, so include your own id.
            if(user.departmentId) or.push({ departmentId : user.departmentId});
            // 2) include other users who share your department, if you belong to one.
            if(user.storeId) or.push({ storeId : user.storeId});
            // 3) include other users who share your store, if you belong to one.
            filter.$or = or;
            // Note: if the caller is an ADMIN (or any role other than MANAGER) and didn't specify
            // a departmentId, none of this scoping applies, so the filter stays just
            // `{ isActive: true }` and every active user is returned as assignable.

        }

        // Only return the fields actually needed by the assignment picker UI (name, email, role) -
        // no need to leak password hashes or other sensitive fields. Sorted alphabetically by
        // first name so the dropdown list is easy to scan.
        return User.find(filter).select("firstName lastName email role ").sort({ firstName : 1})
    }

}
