import multer from "multer";
import path from "node:path";
import crypto from "node:crypto"
import fs from "node:fs"
import type { Request, Response, NextFunction } from "express"
import { settingsService } from "../modules/settings/settings.service.js";

// Where uploaded task-evidence images actually get saved on disk. path.resolve() makes this an
// absolute path, so it works the same regardless of which directory the Node process was
// started from.
const UPLOAD_DIR = path.resolve("uploads", "tasks")

// Same idea, but for evidence photos uploaded against a Ticket's checklist items (see
// checklistImages module) — kept in its own folder, separate from task evidence.
const TICKET_UPLOAD_DIR = path.resolve("uploads", "tickets")


// A fresh clone of this repo won't have an uploads/ folder yet — we don't (and shouldn't) commit
// an empty folder of user-uploaded content to git, so create it at startup if it's missing.

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}
if (!fs.existsSync(TICKET_UPLOAD_DIR)) {
    fs.mkdirSync(TICKET_UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`)
    },
});

const ticketStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TICKET_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`)
    },
})

// Builds a brand-new multer instance using whatever's currently in the settings cache. This is
// cheap (no I/O — multer() just wires up config objects), so it's fine to call fresh on every
// request instead of caching the instance: it means admin-edited upload limits/mime types take
// effect immediately, with no server restart needed.
const buildImageUpload = ( storageEngine : multer.StorageEngine) => {
    const settings = settingsService.getCached();
    return multer({
        storage : storageEngine,
        limits : {
            fileSize : settings.maxUploadSizeMb * 1024 * 1024,
            files : settings.maxUploadFiles,
        },

        fileFilter:(_req, file, cb) => {
            if(!settings.allowedImageTypes.includes(file.mimetype)){
                return cb(null, false)
            }

            cb(null, true)
        }

    })
}

export const taskImageUpload = (req : Request , res : Response , next : NextFunction) => 
    buildImageUpload(storage).array("images" , settingsService.getCached().maxUploadFiles)(req,res,next)

export const checklistImageUpload = (req : Request , res : Response , next : NextFunction) => 
    buildImageUpload(ticketStorage).array("images", settingsService.getCached().maxUploadFiles)(req,res,next)