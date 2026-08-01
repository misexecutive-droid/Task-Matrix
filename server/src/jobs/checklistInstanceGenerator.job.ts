// Recurrence engine for the Checklist feature: sweeps active ChecklistDefinitions and stamps
// out a fresh, completable ChecklistInstance whenever a definition's current period hasn't been
// generated yet. See utils/period.ts for the period-math this relies on.
import cron from "node-cron"
import type { HydratedDocument } from "mongoose"
import { ChecklistDefinition } from "../models/ChecklistDefinition.js"
import { ChecklistDefinitionItem } from "../models/ChecklistDefinitionItem.js"
import { ChecklistInstance } from "../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../models/ChecklistInstanceItem.js"
import { ChecklistInstanceItemSubmission } from "../models/ChecklistInstanceItemSubmission.js"
import { getCurrentPeriod } from "../utils/period.js"
import { env } from "../config/env.js"

// Stamps out the currently-due ChecklistInstance for one definition, or does nothing if its period
// was already generated or its startDate hasn't arrived yet. Shared by the sweep below and by
// checklistDefinition.service.ts's create() — a freshly-created, already-due definition gets its
// first instance immediately instead of waiting for the next hourly tick.
export const generateInstanceForDefinition = async (definition: HydratedDocument<any>, now: Date) => {
    const period = getCurrentPeriod(definition.recurrence, definition.startDate, now, env.CHECKLIST_TIMEZONE_OFFSET_MINUTES)
    if (!period) return null

    const alreadyGenerated = await ChecklistInstance.exists({
        definitionId: definition._id,
        periodKey: period.periodKey,
    })
    if (alreadyGenerated) return null

    let instance
    try {
        instance = await ChecklistInstance.create({
            definitionId: definition._id,
            title: definition.name,
            recurrence: definition.recurrence,
            departmentId: definition.departmentId,
            assigneeIds: definition.assigneeIds,
            periodKey: period.periodKey,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            generatedAt: now,
        })
    } catch (err: any) {
        // Duplicate-key race between this run and a concurrent tick for the same period —
        // the unique (definitionId, periodKey) index already guarantees only one wins.
        if (err?.code === 11000) return null
        throw err
    }

    const items = await ChecklistDefinitionItem.find({ definitionId: definition._id }).sort({ order: 1 })
    if (items.length) {
        const instanceItems = await ChecklistInstanceItem.insertMany(
            items.map((item, index) => ({
                label: item.label,
                order: item.order ?? index,
                // Photo requirements are authored once on the definition item and copied onto
                // every instance it stamps out — an instance item never edits these itself.
                requiredImageCount: item.requiredImageCount,
                maxImageCount: item.maxImageCount,
                requiresLivePhoto: item.requiresLivePhoto,
                itemType: item.itemType,
                accessories: item.accessories,
                instanceId: instance._id,
            })),
        )

        // AUDIT items fan out into one ChecklistInstanceItemSubmission per named auditor, seeded
        // with that item's accessories checklist (all unchecked) — see ChecklistInstanceItemSubmission.ts.
        // insertMany preserves input order, so `items[i]` and `instanceItems[i]` are the same step.
        const submissionDrafts = items.flatMap((item, index) => {
            if (item.itemType !== "AUDIT" || !item.auditUserIds?.length) return []
            const instanceItem = instanceItems[index]
            return item.auditUserIds.map(userId => ({
                itemId: instanceItem._id,
                userId,
                accessories: (item.accessories ?? []).map(name => ({ name, checked: false })),
            }))
        })
        if (submissionDrafts.length) {
            await ChecklistInstanceItemSubmission.insertMany(submissionDrafts)
        }
    }

    // A ONE_TIME definition has exactly one period, ever — deactivate it once generated
    // so the sweep doesn't keep re-checking it forever.
    if (definition.recurrence === "ONE_TIME") {
        definition.isActive = false
        await definition.save()
    }

    return instance
}

const generateDueInstances = async () => {
    const now = new Date()
    // Widen the pre-filter by the same org-timezone offset getCurrentPeriod uses, so a definition
    // whose startDate is "today" in local time but still "tomorrow" by raw UTC clock isn't excluded
    // before generateInstanceForDefinition ever gets a chance to evaluate it.
    const localNow = new Date(now.getTime() + env.CHECKLIST_TIMEZONE_OFFSET_MINUTES * 60_000)
    const definitions = await ChecklistDefinition.find({ isActive: true, startDate: { $lte: localNow } })

    for (const definition of definitions) {
        // Each definition is isolated in its own try/catch — one bad/malformed definition must
        // not abort the sweep for the rest, unlike the single-collection slaSweep job.
        try {
            await generateInstanceForDefinition(definition, now)
        } catch (err) {
            console.error(`Checklist instance generation failed for definition ${definition._id}:`, err)
        }
    }
}

// Registers the hourly sweep and runs it once immediately, so a freshly deployed server (or a
// definition created mid-day) doesn't wait up to an hour for its first instance. Hourly, not
// every-5-minutes like the SLA sweep: every period boundary here is day-granular, so sub-hour
// polling buys nothing, while hourly stays cheap and tolerates brief downtime near midnight.
export const startChecklistInstanceGenerator = () => {
    generateDueInstances().catch(err => console.error("Initial checklist instance generation failed:", err))
    cron.schedule("0 * * * *", () => {
        generateDueInstances().catch(err => console.error("Checklist instance sweep failed:", err))
    })
}
