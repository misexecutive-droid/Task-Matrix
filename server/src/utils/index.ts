// This is a "barrel file" - it re-exports things from other files in this folder so that
// other parts of the app can import from a single, short path (e.g. `from "../utils"`)
// instead of having to know/remember the exact file each thing lives in
// (e.g. `from "../utils/AppError.js"` and `from "../utils/asyncHandler.js"` separately).

// Re-export the custom AppError class (see AppError.ts) so consumers can do
// `import { AppError } from "../utils"`.
export { AppError } from "./AppError.js"
// Re-export the asyncHandler wrapper (see asyncHandler.ts) so consumers can do
// `import { asyncHandler } from "../utils"`.
export { asyncHandler } from "./asyncHandler.js"
