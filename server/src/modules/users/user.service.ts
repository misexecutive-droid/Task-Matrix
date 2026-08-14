import { User } from "../../models/User.js";
import { AppError } from "../../utils/AppError.js";
import { auditService } from "../audit/audit.service.js";
import { AccessTokenPayload } from "../../middleware/auth/auth.js";
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js";

const requireEntity = <T>(entity: T | null, message: string = 'User not found'): T => {
    if (!entity) throw AppError.notFound(message);
    return entity;
};

const requireUnique = <T>(entity: T | null, message: string): void => {
    if (entity) throw AppError.conflict(message);
};

export const userService = {
    async list() {
        return User.find().sort({ createdAt: -1 });
    },

    async getById(id: string) {
        return requireEntity(await User.findById(id));
    },

    async create(input: CreateUserInput, actorId: string) {
        requireUnique(await User.findOne({ email: input.email }), 'Email already registered');

        const user = new User({ ...input, password: input.password });
        await user.save();

        await auditService.record({
            entityType: "User",
            entityId: user._id.toString(),
            action: "CREATE",
            actorId,
            after: { email: user.email, role: user.role, isActive: user.isActive }
        });
        
        return user;
    },

    async update(id: string, input: UpdateUserInput, actorId: string) {
        const before = requireEntity(await User.findById(id));
        const user = requireEntity(await User.findByIdAndUpdate(id, input, { new: true, runValidators: true }));

        await auditService.record({
            entityType: "User",
            entityId: id,
            action: "UPDATE",
            actorId,
            before: { email: before.email, role: before.role, isActive: before.isActive },
            after: { email: user.email, role: user.role, isActive: user.isActive }
        });
        
        return user;
    },

    async remove(id: string, actorId: string) {
        const user = requireEntity(await User.findByIdAndDelete(id));

        await auditService.record({
            entityType: "User",
            entityId: id,
            action: "DELETE",
            actorId,
            before: { email: user.email, role: user.role }
        });

        return user;
    },

    async listAssignable(user: AccessTokenPayload, departmentId?: string, storeId?: string) {
        const isManager = user.role === "MANAGER";
        const effectiveDepartmentId = isManager && departmentId !== user.departmentId ? undefined : departmentId;
        const effectiveStoreId = isManager && storeId !== user.storeId ? undefined : storeId;

        const filter = {
            isActive: true,
            ...(effectiveDepartmentId && { departmentId: effectiveDepartmentId }),
            ...(effectiveStoreId && { storeId: effectiveStoreId }),
            
            ...(isManager && !effectiveDepartmentId && !effectiveStoreId && {
                $or: [
                    { _id: user.sub },
                    ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
                    ...(user.storeId ? [{ storeId: user.storeId }] : [])
                ]
            })
        };

        return User.find(filter).select("firstName lastName email role departmentId").sort({ firstName: 1 });
    }
};