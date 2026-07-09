// Import the shared "lookup router" factory - the same one used for Stores
// and Departments. It generates the standard CRUD routes for us.
import { createLookupRouter } from "../../utils/lookupModule.js";
// The Category model is another simple reference list (e.g. ticket categories
// like "Hardware", "Software", "Network") used to classify other records.
import { Category } from "../../models/Category.js";

// Feeding the Category model into the factory produces a router with:
//   GET    /        -> list all categories (sorted by name), any logged-in user can view
//   POST   /         -> create a new category (admin only)
//   PATCH  /:id       -> update a category by id (admin only)
//   DELETE /:id       -> delete a category by id (admin only)
// Categories don't need any custom behavior beyond basic CRUD, so reusing
// createLookupRouter here (instead of writing near-identical route handlers
// again) keeps the codebase small, consistent, and easy to maintain - the
// same DRY pattern used for Stores and Departments.
export const categoryRouter = createLookupRouter(Category)
