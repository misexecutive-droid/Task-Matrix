import { Project } from "../../models/Project.js" // Mongoose model for the "projects" collection
import { AppError } from "../../utils/AppError.js" // consistent error helper (404, 403, etc.)
import type { AccessTokenPayload } from "../../middleware/auth/auth.js" // decoded JWT info: who's calling, and their role
import type { CreateProjectInput, UpdateProjectInput } from "./project.validation.js" // typed input shapes from the zod schemas
import App from "../../app.js";
// note: "App" is imported here but doesn't appear to be used anywhere below - looks like it might be an unused/leftover import, left as-is

// decides which projects a user is allowed to see:
// admins see everything, everyone else only sees projects where they are the owner OR listed as a member
const visiblityFilter = (user: AccessTokenPayload) =>
    user.role === "ADMIN" ? {} : { $or: [{ onwerId: user.sub }, { memberIds: user.sub }] };
    // note: "onwerId" looks like a typo for "ownerId" (also used consistently below), and "visiblityFilter" is spelled unusually too - left as-is since we're not changing code



    export const projectService = {
        // list all projects visible to this user, newest first
        async list(user: AccessTokenPayload) {
            return Project.find(visiblityFilter(user)).sort({ createAt: -1 });
            // note: sorts by "createAt" - possibly meant to be "createdAt" (Mongoose's default timestamp field name), left as-is
        },

        // fetch one project by id, only if the user is allowed to see it
        async getById (id : string , user : AccessTokenPayload) {
            const project = await Project.findOne({_id : id , ...visiblityFilter(user)})
            if(!project) throw AppError.notFound("Project not found")
            return project;
        },

        // create a new project; the creator automatically becomes the owner
        async create(input : CreateProjectInput , user : AccessTokenPayload){
            return Project.create({ ...input , onwerId : user.sub})
        },

        // update an existing project - this is where the Task/Project relationship's "ownership" rules matter:
        // only the project's owner (or an admin) is allowed to change it
        async update(id : string , input : UpdateProjectInput, user : AccessTokenPayload){
            const project = await Project.findById(id);
            if(!project) throw AppError.notFound("Project not found");
            if(user.role !== "ADMIN" && String(project.onwerId) !== user.sub) {
                // if you're not an admin and you're not the owner, you're not allowed to update this project
                throw AppError.forbidden("Only the project owner can update this project")
            }

            Object.assign(project, input); // copy the new fields from `input` onto the existing document in memory
            await project.save() // persist the changes to the database (this also runs schema validation, unlike a raw update query)
            return project;
        },

        // delete a project - same "must be owner or admin" rule as update
        async remove(id : string , user : AccessTokenPayload){
            const project = await Project.findById(id);
            if(!project) throw AppError.notFound("Project not found");
            if(user.role !== "ADMIN" && String(project.onwerId) !== user.sub){
                throw AppError.forbidden("Only the project owner can delete this project")
            }
            await project.deleteOne(); // remove this document from the database
            return project
            // note: the project is returned here *after* being deleted from the DB - the in-memory object is still valid to read from, it's just no longer in the DB

        }
    }