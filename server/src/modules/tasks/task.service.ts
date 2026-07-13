import { Task } from "../../models/Task.js" // the Mongoose model that talks to the "tasks" collection in MongoDB
import { AppError } from "../../utils/AppError.js" // helper for throwing consistent HTTP-style errors (404, 403, etc.)
import type { AccessTokenPayload } from "../../middleware/auth/auth.js" // the shape of the decoded JWT: who is making this request (their id/role)
import type { CreateTaskInput , UpdateTaskInput } from "./task.validation.js" // typed shapes for create/update input, coming from the zod schemas

const visiblityFilter = ( user : AccessTokenPayload) =>
    user.role === "ADMIN" ? {} : { $or: [{ userId : user.sub }, { assigneeId : user.sub }] }
    // note: "visiblityFilter" is spelled wrong (should be "visibilityFilter") but left as-is since it's just an internal name

export const taskService = {
    async list (user : AccessTokenPayload, filterUserId?: string){
        if (user.role === "ADMIN" && filterUserId) {
            return Task.find({ $or: [{ userId: filterUserId }, { assigneeId: filterUserId }] }).sort({ createdAt: -1 });
        }
        return Task.find(visiblityFilter(user)).sort({ createdAt : -1});
        // FIXED: this used to sort by `createTestAt`, which doesn't exist on the Task schema
        // (Mongoose's `{ timestamps: true }` creates a field called `createdAt`). Sorting on a
        // field that doesn't exist silently does nothing — tasks came back in whatever order
        // MongoDB felt like returning them, not newest-first as intended.
    },


    // fetch a single task by its id, but only if this user is allowed to see it (per visiblityFilter)
    // populates its checklists (and each item's uploaded images) so the task detail view can show
    // them in one call, same pattern as ticket.service.ts's populateTicket.
    async getById ( id : string, user : AccessTokenPayload) {
        const task = await Task.findOne({_id : id , ...visiblityFilter(user)})
            .populate({ path: "checklists", populate: { path: "items", populate: { path: "images" } } });
        if(!task) throw AppError.notFound("Task not found") // if nothing matched (wrong id, or belongs to someone else), respond with a 404-style error
        return task;
    },

    // create a new task; we attach the current user's id so we know who owns/created it.
    // `input` may now also include `assigneeId` if the creator wants to hand it to someone else right away.
    async create(input : CreateTaskInput , user : AccessTokenPayload){
        return Task.create({...input , userId : user.sub})
    },

    async update(id : string, input : UpdateTaskInput , user : AccessTokenPayload) {

        const task = await Task.findOneAndUpdate(
            { _id : id , ...visiblityFilter(user)}, // only update if it exists AND this user owns it OR is assigned to it
            input , // the new field values to apply
            { new : true , runValidators : true}, // "new: true" returns the updated doc (not the old one); "runValidators" re-checks schema rules on update

        );
        if(!task) throw AppError.notFound("Task not found") // nothing matched -> either doesn't exist, or isn't yours/assigned to you
        return task;
    },

    // delete a task, same ownership/assignment rule applies
    async remove(id : string , user : AccessTokenPayload){
        const task = await Task.findOneAndDelete({_id : id , ...visiblityFilter(user)})
       
        if(!task) throw AppError.notFound("Task not found");
        return task;
    },

};
