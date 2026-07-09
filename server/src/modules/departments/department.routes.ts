// Same shared factory used by every other simple lookup table in this app.
// It hands back a router that already has list/create/update/delete routes
// wired up, so we don't need to write that logic again here.
import { createLookupRouter } from "../../utils/lookupModule.js";
// The Department model is just another simple reference list (e.g. "Sales",
// "IT", "HR") that other records (like tickets) can be tagged with.
import { Department  } from "../../models/Department.js";

// Passing the Department model into the factory gives us a router with:
//   GET    /        -> list all departments (sorted by name), any logged-in user can view
//   POST   /         -> create a new department (admin only)
//   PATCH  /:id       -> update a department by id (admin only)
//   DELETE /:id       -> delete a department by id (admin only)
// Because Departments are simple lookup data (no special business logic
// beyond basic CRUD), reusing createLookupRouter here keeps the code DRY
// instead of duplicating the same route handlers for every lookup table.
export const departmentRouter = createLookupRouter(Department)
