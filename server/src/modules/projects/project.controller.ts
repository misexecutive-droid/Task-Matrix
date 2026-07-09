import type { Request, Response } from 'express'; // Express request/response types
import { projectService } from './project.service.js'; // database logic lives here
import { createProjectSchema, updateProjectSchema } from './project.validation.js'; // zod schemas for validating request bodies
import { asyncHandler } from '../../utils/asyncHandler.js'; // catches errors from async route handlers automatically

// Controller layer for Projects - same routes -> controller -> service -> validation pattern as Tasks.
// Note this controller wraps every response in { success: true, data: ... }, unlike the Tasks controller
// which returns the raw object directly - a small inconsistency between the two features, but that's how the existing code works.
export const projectController = {
  // GET /projects - list projects visible to this user
  list: asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.list(req.user!); // req.user comes from the auth middleware after verifying the JWT
    res.json({ success: true, data: projects });
  }),

  // GET /projects/:id - fetch a single project
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getById(req.params.id, req.user!);
    res.json({ success: true, data: project });
  }),

  // POST /projects - create a new project
  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createProjectSchema.parse(req.body); // validate the incoming body, throws on bad input
    const project = await projectService.create(input, req.user!);
    res.status(201).json({ success: true, data: project }); // 201 = successfully created
  }),

  // PATCH /projects/:id - partially update a project (owner/admin only, enforced in the service)
  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateProjectSchema.parse(req.body);
    const project = await projectService.update(req.params.id, input, req.user!);
    res.json({ success: true, data: project });
  }),

  // DELETE /projects/:id - remove a project (owner/admin only, enforced in the service)
  remove: asyncHandler(async (req: Request, res: Response) => {
    await projectService.remove(req.params.id, req.user!);
    res.json({ success: true, data: { deleted: true } }); // no project data left to return, so we just confirm deletion
  }),
};