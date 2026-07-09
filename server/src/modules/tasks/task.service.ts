import { Task } from "../../models/Task.js" // the Mongoose model that talks to the "tasks" collection in MongoDB
import { AppError } from "../../utils/AppError.js" // helper for throwing consistent HTTP-style errors (404, 403, etc.)
import type { AccessTokenPayload } from "../../middleware/auth/auth.js" // the shape of the decoded JWT: who is making this request (their id/role)
import type { CreateTaskInput , UpdateTaskInput } from "./task.validation.js" // typed shapes for create/update input, coming from the zod schemas

// this helper decides which tasks a given user is allowed to see:
// admins can see everything (empty filter = no restriction), everyone else only sees their own tasks (matched by userId)
const visiblityFilter = ( user : AccessTokenPayload) =>
    user.role === "ADMIN" ? {} : {userId : user.sub}
    // note: "visiblityFilter" is spelled wrong (should be "visibilityFilter") but left as-is since we're not changing code

export const taskService = {
    // fetch the list of tasks this user is allowed to see, newest first
    async list (user : AccessTokenPayload){
        return Task.find(visiblityFilter(user)).sort({ createTestAt  : -1});
        // note: this sorts by a field called "createTestAt" — that looks like it might be a typo for "createdAt" and may not sort as intended, but leaving as-is
    },


    // fetch a single task by its id, but only if this user is allowed to see it (per visiblityFilter)
    async getById ( id : string, user : AccessTokenPayload) {
        const task = await Task.findOne({_id : id , ...visiblityFilter(user)});
        if(!task) throw AppError.notFound("Task not found") // if nothing matched (wrong id, or belongs to someone else), respond with a 404-style error
        return task;
    },

    // create a new task; we attach the current user's id so we know who owns it
    async create(input : CreateTaskInput , user : AccessTokenPayload){
        return Task.create({...input , userId : user.sub})
    },

    // update an existing task (partial fields allowed, per updateTaskSchema)
    async update(id : string, input : UpdateTaskInput , user : AccessTokenPayload) {

        const task = await Task.findOneAndUpdate(
            { _id : id , ...visiblityFilter(user)}, // only update if it exists AND this user is allowed to see/own it
            input , // the new field values to apply
            { new : true , runValidators : true}, // "new: true" returns the updated doc (not the old one); "runValidators" re-checks schema rules on update

        );
        if(!task) throw AppError.notFound("Task not found") // nothing matched -> either doesn't exist or isn't this user's task
        return task;
    },

    // delete a task, same ownership/visibility rule applies
    async remove(id : string , user : AccessTokenPayload){
        const task = await Task.findByIdAndDelete({_id : id , ...visiblityFilter(user)})
        // note: findByIdAndDelete normally expects just an id as its first argument, not a filter object with extra conditions merged in —
        // passing an object like this may not actually apply the visiblityFilter conditions the way findOneAndDelete would. Left as-is.
        if(!task) throw AppError.notFound("Task not found");
        return task;
    },

};