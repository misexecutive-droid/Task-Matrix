import { Schema, model } from "mongoose"
import { CHECKLIST_RECURRENCES } from "./ChecklistDefinition.js"

// An auto-generated, per-period completable checklist, stamped out from a ChecklistDefinition
// by the background generator job whenever a new period (day/week/month/quarter/year, or the
// single ONE_TIME day) becomes due. Fields that originate on the parent definition are snapshotted
// here at generation time (title/recurrence/departmentId/assigneeIds) so historical instances stay
// correct even if the definition is later changed — and so "my instances" can be queried directly
// by assigneeIds with no join back to the definition.
const checklistInstanceSchema = new Schema(
    {
        definitionId: { type: Schema.Types.ObjectId, ref: "ChecklistDefinition", required: true, index: true },
        title: { type: String, required: true },
        recurrence: { type: String, enum: CHECKLIST_RECURRENCES, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
        assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        // Idempotency key for "has this period already been generated?" — see utils/period.ts.
        // Literal YYYY-MM-DD of the period's start date, or the constant "ONE_TIME".
        periodKey: { type: String, required: true, index: true },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        generatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

// One instance per definition per period — the DB-level backstop against a race between the
// generator's immediate boot-run and its first cron tick.
checklistInstanceSchema.index({ definitionId: 1, periodKey: 1 }, { unique: true })

checklistInstanceSchema.virtual("items", {
    ref: "ChecklistInstanceItem",
    localField: "_id",
    foreignField: "instanceId",
})

export const ChecklistInstance = model("ChecklistInstance", checklistInstanceSchema)
