import { Todo } from "../../models/Todo.js"
import { AppError } from "../../utils/AppError.js"
import type { CreateTodoInput, UpdateTodoInput } from "./todo.validation.js"

export const todoService = {
    async listForUser(userId: string) {
        return Todo.find({ userId }).sort({ createdAt: -1 })
    },

    async create(userId: string, input: CreateTodoInput) {
        return Todo.create({ userId, text: input.text, dueDate: input.dueDate, priority: input.priority })
    },

    // { _id: id, userId } ownership filter stops one user from editing someone else's todo
    async update(id: string, userId: string, input: UpdateTodoInput) {
        const todo = await Todo.findOneAndUpdate({ _id: id, userId }, input, { new: true })
        if (!todo) throw AppError.notFound('Todo not found')
        return todo
    },

    async remove(id: string, userId: string) {
        const todo = await Todo.findOneAndDelete({ _id: id, userId })
        if (!todo) throw AppError.notFound('Todo not found')
    },
}
