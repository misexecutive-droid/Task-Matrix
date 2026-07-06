import { Project } from "../../models/Project.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateProjectInput, UpdateProjectInput } from "./project.validation.js"
import App from "../../app.js";

const visiblityFilter = (user: AccessTokenPayload) => 
    user.role === "ADMIN" ? {} : { $or: [{ onwerId: user.sub }, { memberIds: user.sub }] };



    export const projectService = {
        async list(user: AccessTokenPayload) {
            return Project.find(visiblityFilter(user)).sort({ createAt: -1 });
        },

        async getById (id : string , user : AccessTokenPayload) {
            const project = await Project.findOne({_id : id , ...visiblityFilter(user)})
            if(!project) throw AppError.notFound("Project not found")
            return project;
        },

        async create(input : CreateProjectInput , user : AccessTokenPayload){
            return Project.create({ ...input , onwerId : user.sub})
        },

        async update(id : string , input : UpdateProjectInput, user : AccessTokenPayload){
            const project = await Project.findById(id);
            if(!project) throw AppError.notFound("Project not found");
            if(user.role !== "ADMIN" && String(project.onwerId) !== user.sub) {
                throw AppError.forbidden("Only the project owner can update this project")
            }

            Object.assign(project, input);
            await project.save()
            return project;
        },

        async remove(id : string , user : AccessTokenPayload){
            const project = await Project.findById(id);
            if(!project) throw AppError.notFound("Project not found");
            if(user.role !== "ADMIN" && String(project.onwerId) !== user.sub){
                throw AppError.forbidden("Only the project owner can delete this project")
            }
            await project.deleteOne();
            return project

        }
    }