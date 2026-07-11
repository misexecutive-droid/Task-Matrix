import { z } from "zod";
import { CAPTURE_METHODS } from "../../models/TaskImage.js";


// The uploaded files themselves are validated by multer (config/upload.ts) — this just validates
// the one piece of metadata that rides alongside them in the same request: how the photo was
// actually obtained (from the live-camera widget, or a normal gallery/file picker).

export const uploadImageSchema = z.object({
    captureMethod : z.enum(CAPTURE_METHODS),

});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;