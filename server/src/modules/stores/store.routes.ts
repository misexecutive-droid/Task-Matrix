// This factory function builds a ready-made Express router that already knows
// how to list, create, update, and delete records for a given Mongoose model.
// We import it here instead of writing our own GET/POST/PATCH/DELETE handlers.
import { createLookupRouter } from "../../utils/lookupModule.js";
// The Store model represents a simple "lookup" table (a list of stores, like
// a dropdown reference list) that other parts of the app (e.g. tickets) point to.
import { Store } from "../../models/Store.js"

// Call the factory with the Store model. This single line gives us a fully
// working router with routes for:
//   GET    /        -> list all stores (sorted by name), open to any logged-in user
//   POST   /         -> create a new store (admin only)
//   PATCH  /:id       -> update an existing store by its id (admin only)
//   DELETE /:id       -> delete a store by its id (admin only)
// Using this shared factory avoids copy/pasting the same CRUD code for every
// simple reference table (Stores, Departments, Categories, etc.) - this is
// the "Don't Repeat Yourself" (DRY) principle in action.
export const StoreRouter = createLookupRouter(Store)
