import { z } from "zod";

export const auditQuerySchema = z.object({
    entityType : z.string().min(1),
    entityId : z.string().regex(/^[0-9a-fA-F]{24}$/ , "Invalid id")
})