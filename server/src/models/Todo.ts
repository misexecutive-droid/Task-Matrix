import { Schema, model } from "mongoose"

export const TODO_PRIORITIES = ["low", "medium", "high"] as const
export type TodoPriority = (typeof TODO_PRIORITIES)[number]

const todoSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // owner — a todo is always self-scoped, never assigned to anyone else
        text: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: Date, default: null },
        priority: { type: String, enum: TODO_PRIORITIES, default: "medium" },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

export const Todo = model('Todo', todoSchema)
