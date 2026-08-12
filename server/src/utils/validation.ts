import { z } from "zod"

// A MongoDB ObjectId is always a 24-character hex string — shared across every validation
// schema that accepts one, instead of each module redefining the same regex.
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
