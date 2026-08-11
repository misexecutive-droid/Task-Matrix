import { Department } from "../../models/Department.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateDepartmentInput, UpdateDepartmentInput, updateDepartmentSchema } from "./department.validation.js";

export const departmentService = {
    async list(){
        return Department.find().sort({name : 1})
    },

    async getById(id : string){
        const department = await Department.findById(id)
        if(!department) throw AppError.notFound("Department not found")
        return department
    },

    async create( input : CreateDepartmentInput){
        const existing = await Department.findOne({ name : input.name})  // findone 
        if(existing) throw AppError.conflict("Name already exits")
        return Department.create(input)
    },

    async update(id : string , input : UpdateDepartmentInput){
        const department = await Department.findByIdAndUpdate(id, input , { new : true, runValidators : true})
        if(!department) throw AppError.notFound("Department not found")
         return department
    },

    async remove(id : string){
        const department = await Department.findByIdAndDelete(id)
        if(!department) throw AppError.notFound("Departmetn not found")
            return department
    },

    // Free-text -> Department resolution for the AI task-creation pipeline. Mirrors the client's
    // findDepartmentByName (SmartTaskModal.tsx), which has no server-side equivalent today.
    async resolveByName(name : string){
        const clean = name.replace(/\b(department|dept|team)\b/gi, "").trim().toLowerCase()
        if(!clean) return null
        const active = await Department.find({ isActive : true })
        return active.find((d) => d.name.toLowerCase().includes(clean)) ?? null
    }
}