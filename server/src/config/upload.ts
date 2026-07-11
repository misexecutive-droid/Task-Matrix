import multer from "multer";
import path from "node:path";
import crypto from "node:crypto"
import fs from "node:fs"

// Where uploaded task-evidence images actually get saved on disk. path.resolve() makes this an
// absolute path, so it works the same regardless of which directory the Node process was
// started from.
const UPLOAD_DIR = path.resolve("uploads", "tasks")


// A fresh clone of this repo won't have an uploads/ folder yet — we don't (and shouldn't) commit
// an empty folder of user-uploaded content to git, so create it at startup if it's missing.

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Only these image types are ever accepted. This is a real security control, not a nicety:
// without an allowlist, someone could upload a file with a dangerous extension disguised behind
// an image-sounding name.

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),


    // NEVER use the original filename someone uploaded — generate a random one instead. This
    // avoids two real problems: (1) path traversal, where a crafted filename like
    // "../../../server.ts" could try to write outside the upload folder, and (2) collisions,
    // where two different people both uploading "photo.jpg" would silently overwrite each other.

    filename: (_req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`)
    },

});

export const taskImageUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },

    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {

            // Passing `false` (not throwing an error) tells multer "silently skip this one file,
            // don't abort the whole request" — the route handler is responsible for noticing if
            // fewer files came through than the client thought it sent.

            return cb(null, false)

        }
        cb(null, true)
    }
})