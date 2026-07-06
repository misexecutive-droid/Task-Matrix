import { AuditLog } from "../../models/AuditLog.js";
 

export const auditService = {
    async record( params : {
        entityType : string;
        entityId : string;
        action : string;
        actorId : string;
        before?:unknown;
        after?:unknown;
    }){
        try{
            await AuditLog.create({
                entityType : params.entityType,
                entityId : params.entityId,
                action : params.action,
                actorId : params.actorId,
                before : params.before ?? null,
                after : params.after ?? null,
            });
        }catch(err){
            console.error("Failed to write audit log", err)
        }
    },

    async listForEntity(entityType : string , entityId : string){
        return AuditLog.find({ entityType , entityId})
        .sort({ createAt : -1})
        .populate({ path : "actorId" , select : "email firstName role"});
    },
}