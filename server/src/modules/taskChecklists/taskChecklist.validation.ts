import {z } from "zod"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/ , "Invalid id")


// Creating a new checklist under a task — you can optionally seed it with items right away,
// each with its own photo requirements set at creation time (as you described).

export const createTaskChecklistSchema = z.object({
    title : z.string().min(1),
    items : z.array(z.object({
      label : z.string().min(1),
      assigneeId : objectId.optional(),
      dueAt : z.string().datetime().optional(),
      requiredImageCount : z.number().int().min(0).optional(),
      requiresLivePhoto : z.boolean().optional()
    })).optional(),
})

// Editing an EXISTING checklist item's metadata later — reassigning it, changing its due date,
// or adjusting its photo requirements.

// Notice `isDone` only accepts the literal value `false`, never `true`. That's deliberate, not
// an oversight: marking an item done has a real business rule attached to it (were enough
// compliant photos actually uploaded?), so it can't happen through a generic "update whatever
// fields you send me" endpoint. Completing an item goes through its own dedicated action
// instead (see step 6/7 — taskChecklist.service.ts's completeItem, exposed as its own route),
// which is the only place that actually checks compliance before allowing isDone: true.
// This schema can still "reopen" an already-completed item (isDone: false) since undoing a
// completion doesn't need any of those checks — you're just going back to "not done yet."

export const updateTaskChecklistItemSchema = z.object({
    label :  z.string().min(1).optional(),
    assigneeId : objectId.nullable().optional(),
    dueAt : z.string().datetime().nullable().optional(),
    requiredImageCount : z.number().int().min(0).optional(),
    requiresLivePhoto : z.boolean().optional(),
    isDone : z.literal(false).optional()
})

export type CreateTaskChecklistInput = z.infer<typeof createTaskChecklistSchema>
export type UpdateTaskChecklistItemInput = z.infer<typeof updateTaskChecklistItemSchema>
