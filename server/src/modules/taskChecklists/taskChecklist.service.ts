import { Task } from "../../models/Task.js"
import { TaskChecklist } from "../../models/TaskChecklist.js"
import { TaskChecklistItem } from "../../models/TaskChecklistItem.js"
import { TaskImage } from "../../models/TaskImage.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTaskChecklistInput, UpdateTaskChecklistItemInput } from "./taskChecklist.validation.js"

// Populate helper: expands a checklist's items, and each item's uploaded images, so one API
// call gives the frontend everything it needs instead of several round trips.
const populateChecklist = (query: any) =>
    query.populate({ path: "items", populate: { path: "images" } })

// Who's allowed to change a checklist's STRUCTURE — create/edit/delete checklists and items,
// change photo requirements, reassign items: the task's owner, or an admin. This is deliberately
// a different permission than "who can complete an item" below — managing the work is not the
// same thing as doing the work.
const assertCanManage = (user: AccessTokenPayload, task: any) => {
    if (user.role === "ADMIN") return;
    if (String(task.userId) === user.sub) return;
    throw AppError.forbidden("Only the task owner can manage its checklists");
};

// Who's allowed to mark a specific item complete, or upload photos toward it — the item's
// assignee, or an admin. Not the task owner automatically (unless they're also the assignee) —
// completion is about who actually did the work.
const assertCanComplete = (user: AccessTokenPayload, item: any) => {
    if (user.role === "ADMIN") return;
    if (item.assigneeId && String(item.assigneeId) === user.sub) return;
    throw AppError.forbidden("Only the assigned person can complete this item");
};

export const taskChecklistService = {
    // Create a new checklist under a task, optionally seeded with items right away — each item
    // can carry its own assigneeId/dueDate/photo requirements from the moment it's created.
    async createForTask(taskId: string, input: CreateTaskChecklistInput, user: AccessTokenPayload) {
        const task = await Task.findById(taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanManage(user, task);

        const checklist = await TaskChecklist.create({ title: input.title, taskId });

        if (input.items?.length) {
            await TaskChecklistItem.insertMany(
                input.items.map((item) => ({ ...item, taskChecklistId: checklist._id })),
            );
        }

        return populateChecklist(TaskChecklist.findById(checklist._id));
    },

    // Update an existing item's metadata (label, assignee, due date, photo requirements, or
    // reopen it with isDone: false). Marking it DONE is a separate action — see completeItem.
    async updateItem(itemId: string, input: UpdateTaskChecklistItemInput, user: AccessTokenPayload) {
        const item = await TaskChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");

        const checklist = await TaskChecklist.findById(item.taskChecklistId);
        const task = await Task.findById(checklist?.taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanManage(user, task);

        Object.assign(item, input);
        await item.save();
        return item;
    },

    // THE key method: the one place in the whole app that decides "yes, this checklist item is
    // genuinely done." It checks the actual uploaded TaskImage records against the item's own
    // requirements — it never trusts the client to have counted correctly, because the client
    // isn't a trusted source of truth (see the earlier note on why isDone:true isn't a plain
    // field update).
    async completeItem(itemId: string, user: AccessTokenPayload) {
        const item = await TaskChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        assertCanComplete(user, item);

        const images = await TaskImage.find({ taskChecklistItemId: item._id });

        // If a live photo is required, only images actually captured live count toward the
        // requirement — a gallery photo uploaded when live was mandatory doesn't satisfy it,
        // even if the total image count would otherwise be enough.
        const qualifyingImages = item.requiresLivePhoto
            ? images.filter((img) => img.captureMethod === "LIVE")
            : images;

        if (qualifyingImages.length < item.requiredImageCount) {
            const missing = item.requiredImageCount - qualifyingImages.length;
            const kind = item.requiresLivePhoto ? "live photo(s)" : "photo(s)";
            throw AppError.badRequest(`Upload ${missing} more ${kind} before this item can be marked complete`);
        }

        item.isDone = true; // triggers the model's pre('save') hook, which stamps completedAt automatically
        await item.save();
        return item;
    },

    // Set the item's remarks — free text the assignee writes about their own work on this item.
    // Uses assertCanComplete (assignee-or-admin), NOT assertCanManage, because this is the person
    // doing the work describing what they did, not a structural change to the item's definition.
    async updateRemarks(itemId: string, remarks: string, user: AccessTokenPayload) {
        const item = await TaskChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        assertCanComplete(user, item);

        item.remarks = remarks;
        await item.save();
        return item;
    },

    // Delete a whole checklist and everything under it. MongoDB doesn't cascade deletes the way
    // a relational DB with ON DELETE CASCADE would, so this has to happen manually, in order:
    // images first, then items, then the checklist itself.
    async removeChecklist(checklistId: string, user: AccessTokenPayload) {
        const checklist = await TaskChecklist.findById(checklistId);
        if (!checklist) throw AppError.notFound("Checklist not found");
        const task = await Task.findById(checklist.taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanManage(user, task);

        const items = await TaskChecklistItem.find({ taskChecklistId: checklist._id });
        const itemIds = items.map((i) => i._id);
        // This deletes the image RECORDS in the database. The actual files sitting on disk get
        // cleaned up separately, by the upload module — keeping "delete the DB row" and "delete
        // the real file" as two distinct steps is intentional (different failure modes, different
        // owners), not something forgotten. We'll wire that part up soon.
        await TaskImage.deleteMany({ taskChecklistItemId: { $in: itemIds } });
        await TaskChecklistItem.deleteMany({ taskChecklistId: checklist._id });
        await checklist.deleteOne();
        return checklist;
    },

    async removeItem(itemId: string, user: AccessTokenPayload) {
        const item = await TaskChecklistItem.findById(itemId);
        if (!item) throw AppError.notFound("Checklist item not found");
        const checklist = await TaskChecklist.findById(item.taskChecklistId);
        const task = await Task.findById(checklist?.taskId);
        if (!task) throw AppError.notFound("Task not found");
        assertCanManage(user, task);

        await TaskImage.deleteMany({ taskChecklistItemId: item._id });
        await item.deleteOne();
        return item;
    },
};
