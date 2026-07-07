import { User } from "../../models/User.js"
import { AppError } from "../../utils/AppError.js"
import type { Role } from "../../models/User.js"
import { auditService } from "../audit/audit.service.js"
import { AccessTokenPayload } from "../../middleware/auth/auth.js"


type CreateUserInput = {
    email: string; password: string; firstName: string; lastName?: string;
    role: Role; departmentId?: string; storeId?: string
}

type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>> & { isActive?: boolean };

export const userService = {
    async list() {
        return User.find().sort({ createdAt: -1 })
    },

    async getById(id: string) {
        const user = await User.findById(id)
        if (!user) throw AppError.notFound('User not found');
        return user;
    },

    async create(input: CreateUserInput , actorId : string) {
        const existing = await User.findOne({ email: input.email });
        if (existing) throw AppError.conflict('Email already registered')


        const user = new User({ ...input });
        (user as any).password = input.password;
        await user.save()

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
        if (id === actorId && input.isActive === false) {
            throw AppError.badRequest('You cannot deactivate your own account')
        }
        if (id === actorId && input.role && input.role !== 'ADMIN') {
            throw AppError.badRequest('You cannot demote your own account')
        }

        const before = await User.findById(id);
        if(!before) throw AppError.notFound("User not found")

        const user = await User.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!user) throw AppError.notFound('User not found')

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
        if (id === actorId) throw AppError.badRequest("You cannot delete your own account ")

        const user = await User.findByIdAndDelete(id);
        if (!user) throw AppError.notFound('User not found')

        await auditService.record({
            entityType : "User",
            entityId : id,
            action : "DELETE",
            actorId,
            before : { email : user.email, role : user.role}
        })

        return user;
    },

    async listAssignable( user : AccessTokenPayload ) {
        const filter: Record <string , unknown> = { isActive : true};
        if(user.role === "MANAGER"){
            const or : Record<string , unknown>[] = [{_id : user.sub}];
            if(user.departmentId) or.push({ departmentId : user.departmentId});
            if(user.storeId) or.push({ storeId : user.storeId});
            filter.$or = or;

        }

        return User.find(filter).select("firstName lastName email role ").sort({ firstName : 1})
    }

}