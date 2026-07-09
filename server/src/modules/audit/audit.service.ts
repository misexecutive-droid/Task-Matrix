import { AuditLog } from "../../models/AuditLog.js"; // the Mongoose model/collection where audit log entries are stored


// The audit service is the "write it down" part of our compliance trail.
// Whenever something important happens (a Ticket is created/updated/deleted, a User's role changes, etc.)
// other parts of the app call auditService.record(...) to save a snapshot of what changed and who did it.
// This is valuable because later, if something looks wrong, an admin can look at the audit log and see
// exactly who changed a record, when, and what the data looked like before and after - accountability + debugging.
export const auditService = {
    // Records one audit log entry describing a single change to a single entity.
    async record( params : {
        entityType : string; // e.g. "Ticket", "User" - what kind of thing changed
        entityId : string; // the _id of the specific record that changed
        action : string; // e.g. "CREATE", "UPDATE", "DELETE" - what kind of change happened
        actorId : string; // the _id of the user who made the change (for accountability - "who did this?")
        before?:unknown; // a snapshot of the data before the change (optional, e.g. not applicable on CREATE)
        after?:unknown; // a snapshot of the data after the change (optional, e.g. not applicable on DELETE)
    }){
        try{
            // save a new AuditLog document with all the details of this change
            await AuditLog.create({
                entityType : params.entityType,
                entityId : params.entityId,
                action : params.action,
                actorId : params.actorId,
                before : params.before ?? null, // if no "before" was given, store null instead of undefined
                after : params.after ?? null, // if no "after" was given, store null instead of undefined
            });
        }catch(err){
            // We deliberately swallow (catch) the error here instead of throwing it.
            // Why? Writing an audit log is a side effect - if it fails, we don't want it to block or
            // crash the main action (e.g. creating a ticket) just because logging failed.
            // We still log the error to the console so a developer can notice it.
            console.error("Failed to write audit log", err)
        }
    },

    // Fetches the full audit history for one entity, newest first - e.g. "show me everything that ever happened to Ticket #123"
    async listForEntity(entityType : string , entityId : string){
        return AuditLog.find({ entityType , entityId}) // find all logs matching this entity type + id
        .sort({ createAt : -1}) // sort so the newest entries come first
        // note: this looks like it might not do what's intended - the AuditLog schema uses { timestamps: true },
        // which creates a field called "createdAt" (with a "d"), not "createAt". Sorting on a field that
        // doesn't exist likely means this sort has no real effect and results come back in insertion/default order.
        .populate({ path : "actorId" , select : "email firstName role"}); // replace the raw actorId with the actual user's email/firstName/role, so the frontend doesn't have to look it up separately
    },
}