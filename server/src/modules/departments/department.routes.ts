import { createLookupRouter } from "../../utils/lookupModule.js";
import { Department  } from "../../models/Department.js";

export const departmentRouter = createLookupRouter(Department)