import { z } from "zod"; // schema validation library, same as used in task.validation.ts

// same reusable "is this a valid Mongo id" check as in task.validation.ts
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// shape of a valid "create project" request body
export const createProjectSchema = z.object({
    name : z.string().min(1), // every project needs a non-empty name
    description : z.string().optional(), // optional free-text description
    memberIds : z.array(objectId).optional() // optional list of user ids who are members of this project (this is the Project <-> Users relationship)
});

// updates allow any subset of the create fields
export const updateProjectSchema = createProjectSchema.partial()

// TypeScript types inferred from the schemas, used elsewhere for type-safe inputs
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
