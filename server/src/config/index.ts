// Re-export "env" from env.ts, so other files can do `import { env } from "./config/index.js"`
// instead of having to know it actually lives in "./config/env.js". This is called a "barrel file" —
// it collects exports from multiple files in a folder into one convenient entry point.
export { env } from "./env.js"
// Re-export connectDB and disconnectDB from db.ts for the same reason.
export { connectDB, disconnectDB } from "./db.js"
