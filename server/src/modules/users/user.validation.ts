import { z } from "zod"
import { ROLES } from "../../models/User.js"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    role: z.enum(ROLES),
    departmentId: objectId.optional(),
    storeId: objectId.optional(),
});

// Password changes aren't handled through this update endpoint (see user.service.ts's
// UpdateUserInput comment) — same reason it's left out of update here, only create needs it.
export const updateUserSchema = createUserSchema.omit({ password: true }).partial().extend({
    isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
