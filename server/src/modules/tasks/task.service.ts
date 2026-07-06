import { Task } from "../../models/Task.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskInput , UpdateTaskInput } from "./task.validation.js"

const visiblityFilter = ( user : AccessTokenPayload) => 
    user.role === "ADMIN" ? {} : {userId : user.sub}

export const taskService = {
    async list (user : AccessTokenPayload){
        return Task.find(visiblityFilter(user)).sort({ createTestAt  : -1});
    },


    async getById ( id : string, user : AccessTokenPayload) {
        const task = await Task.findOne({_id : id , ...visiblityFilter(user)});
        if(!task) throw AppError.notFound("Task not found")
        return task;
    },

    async create(input : CreateTaskInput , user : AccessTokenPayload){
        return Task.create({...input , userId : user.sub})
    },

    async update(id : string, input : UpdateTaskInput , user : AccessTokenPayload) {

        const task = await Task.findOneAndUpdate(
            { _id : id , ...visiblityFilter(user)},
            input ,
            { new : true , runValidators : true},
 
        );
        if(!task) throw AppError.notFound("Task not found")
        return task;
    },

    async remove(id : string , user : AccessTokenPayload){
        const task = await Task.findByIdAndDelete({_id : id , ...visiblityFilter(user)})
        if(!task) throw AppError.notFound("Task not found");
        return task;
    },

};