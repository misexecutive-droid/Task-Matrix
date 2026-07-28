import { Category } from "../../models/Category.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation.js";

export const categoryService = {
    async list() {
        return Category.find().sort({ name: 1 }).populate("departmentId", "name").populate("assigneeIds", "firstName lastName email")
    },

    async getById(id: string) {
        const category = await Category.findById(id)
            .populate("departmentId", "name")
            .populate("assigneeIds", "firstName lastName email")
        if (!category) throw AppError.notFound("Category not found")
        return category
    },

    async create(input: CreateCategoryInput) {
        const existing = await Category.findOne({ name: input.name })
        if (existing) throw AppError.conflict("Name is already exists")
        return Category.create(input)
    },

    async update(id: string, input: UpdateCategoryInput) {
        const category = await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true })
        if (!category) throw AppError.notFound("Category not found")
        return category
    },

    async remove(id: string) {
        const category = await Category.findByIdAndDelete(id)
        if (!category) throw AppError.notFound("Category not found")
        return category
    }
}