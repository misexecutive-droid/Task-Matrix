import { User } from "../../models/User.js"
import { AppError } from "../../utils/AppError.js"
import type { Role } from "../../models/User.js"


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

    async create(input: CreateUserInput) {
        const existing = await User.findOne({ email: input.email });
        if (existing) throw AppError.conflict('Email already registered')


        const user = new User({ ...input });
        (user as any).password = input.password;
        await user.save()
        return user;

    },

    async update(id: string, input: UpdateUserInput, actorId: string) {
        if (id === actorId && input.isActive === false) {
            throw AppError.badRequest('You cannot deactivate your own account')
        }
        if (id === actorId && input.role && input.role !== 'ADMIN') {
            throw AppError.badRequest('You cannot demote your own account')
        }

        const user = await User.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!user) throw AppError.notFound('User not found')
        return user
    },

    async remove(id: string, actorId: string) {
        if (id === actorId) throw AppError.badRequest("You cannot delete your own account ")

        const user = await User.findByIdAndDelete(id);
        if (!user) throw AppError.notFound('User not found')

        return user;
    }

}