import { createLookupRouter } from "../../utils/lookupModule.js";
import { Category } from "../../models/Category.js";

export const categoryRouter = createLookupRouter(Category)