import { Schema , model } from "mongoose"

const settingSchema = new Schema(
    {
                // Fallback TAT (turnaround-time) hours applied to a ticket when it's created without
        // its own tatHours — see ticket.service.ts's create(). Without this, such tickets never
        // go overdue (tatDueAt stays null forever).

        defaultTatHours : { type : Number, required : true , default : 24 , min : 1},

        maxUploadSizeMb : { type : Number , required : true , default : 5 , min : 1},
        maxUploadFiltes : { type : Number , required : true, default : 10 , min : 1},

        allowedImageTypes : {
            type : [String],
            required : true,
            default : ["image/jpeg", "image/png" , "image/webp"]
        },
        


    },
    { timestamps : true, toJSON : { virtuals : true }, toObject : { virtuals : true}}
)

export const Settings = model("Settings" , settingSchema)