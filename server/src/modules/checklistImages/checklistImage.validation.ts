import { z } from "zod";
import { CAPTURE_METHODS } from "../../models/TaskImage.js";

// Same idea as taskImages/taskImage.validation.ts — the files themselves are validated by
// multer (config/upload.ts's checklistImageUpload), this just validates the one piece of
// metadata riding alongside them: how the photo was actually obtained.

export const uploadImageSchema = z.object({
    captureMethod: z.enum(CAPTURE_METHODS),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;