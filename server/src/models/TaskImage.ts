import { Schema , model } from "mongoose"



// What method was actually used to capture this photo. Locked as an exact set of values —
// this is what the daily compliance job checks against a checklist item's requiresLivePhoto
// flag to compute the "quality rate" (did people actually use the camera when required to,
// instead of picking an existing photo from their gallery).

export const CAPTURE_METHODS = ["LIVE", "GALLERY"] as const
export type CaptureMethod = (typeof CAPTURE_METHODS)[number]


const taskImageSchema = new Schema(
    {
         // url: where the file actually lives — with local disk storage this will be something
        // like "/uploads/tasks/3f2a91c7e8b04d1a9c6f2e7b1d4a8c3f.jpg". Deliberately NOT the
        // original filename someone uploaded (see multer config in the next few files) — using
        // a randomly generated filename instead of the user's original one prevents two real
        // security problems: (1) path traversal, where a malicious filename like "../../app.ts"
        // could try to write outside the intended folder, and (2) filename collisions, where two
        // people uploading a file both named "photo.jpg" would silently overwrite each other.
        url:{ type : String , required : true},

          // originalFilename: kept ONLY for display purposes (e.g. showing "photo.jpg" in the UI),
        // never used to actually locate the file on disk.
        originalFilename : { type : String, default : null },

        //sizeBytes : recorded fot the same reason - useful for enforcing/auditing upload size
        // limits later, and for showing file size in the UI without re-reading the file from disk.

        sizeBytes : { type : Number ,required : true},


                // taskChecklistItemId: which checklist item this photo is evidence for.
        // index: true speeds up "how many images exist for this item" lookups.

        taskChecklistItemId : { type : Schema.Types.ObjectId , ref : "TaskChecklistItem" , required : true, index : true},

        uploadedBy : { type : Schema.Types.ObjectId, ref : "User", required : true},


    },
    { timestamps : true , toJSON : { virtuals : true} , toObject : { virtuals : true}}
)

export const TaskImage = model("TaskImage" , taskImageSchema)