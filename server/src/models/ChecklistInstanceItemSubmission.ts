import { Schema, model } from "mongoose"

// One row per required auditor on an itemType "AUDIT" ChecklistInstanceItem (see that model and
// ChecklistDefinitionItem.ts for the feature's overall shape). Stamped out at instance-generation
// time — one per ChecklistDefinitionItem.auditUserIds entry — never created afterward. Department
// is intentionally NOT stored here: populate userId and read its departmentId live, same as every
// other part of the app looks up a user's department, rather than snapshotting a value that would
// go stale if the user is later reassigned.
const checklistInstanceItemSubmissionSchema = new Schema(
    {
        itemId: { type: Schema.Types.ObjectId, ref: "ChecklistInstanceItem", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accessories: [
            {
                name: { type: String, required: true, trim: true },
                checked: { type: Boolean, default: false },
            },
        ],
        remarks: { type: String, default: null },
        isDone: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

checklistInstanceItemSubmissionSchema.index({ itemId: 1, userId: 1 }, { unique: true })

checklistInstanceItemSubmissionSchema.virtual("images", {
    ref: "ChecklistInstanceItemSubmissionImage",
    localField: "_id",
    foreignField: "submissionId",
})

// Keep completedAt in sync with isDone, same convention as ChecklistInstanceItem's pre-save hook.
checklistInstanceItemSubmissionSchema.pre("save", function (next) {
    if (this.isModified("isDone")) {
        this.completedAt = this.isDone ? new Date() : null
    }
    next()
})

export const ChecklistInstanceItemSubmission = model("ChecklistInstanceItemSubmission", checklistInstanceItemSubmissionSchema)
