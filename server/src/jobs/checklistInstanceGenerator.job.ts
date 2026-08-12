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

// Stamps out the currently-due ChecklistInstance for one (definition, store) pair. Caller is
// responsible for the "already generated for this period?" check — see generateInstanceForDefinition,
// which now does that once for every store up front instead of once per store here. `items` is the
// definition's item list, also hoisted up by the caller since it's identical for every store.
const generateInstanceForStore = async (definition: HydratedDocument<any>, storeId: unknown, period: { periodKey: string; periodStart: Date; periodEnd: Date }, now: Date, items: HydratedDocument<any>[]) => {
    let instance
    try {
        instance = await ChecklistInstance.create({
            definitionId: definition._id,
            title: definition.name,
            recurrence: definition.recurrence,
            storeId,
            opensTime: definition.opensTime,
            cutoffTime: definition.cutoffTime,
            assigneeIds: definition.assigneeIds,
            periodKey: period.periodKey,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            generatedAt: now,
        })
    } catch (err: any) {
        // Duplicate-key race between this run and a concurrent tick for the same period —
        // the unique (definitionId, storeId, periodKey) index already guarantees only one wins.
        if (err?.code === 11000) return null
        throw err
    }

    try {
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
                    numberEntryUnit: item.numberEntryUnit,
                    numberEntryMin: item.numberEntryMin,
                    numberEntryMax: item.numberEntryMax,
                    ratingScale: item.ratingScale,
                    options: item.options,
                    gpsTargetLat: item.gpsTargetLat,
                    gpsTargetLng: item.gpsTargetLng,
                    gpsRadiusMeters: item.gpsRadiusMeters,
                    signatureLabels: item.signatureLabels,
                    qrExpectedValue: item.qrExpectedValue,
                    cashExpectedAmount: item.cashExpectedAmount,
                    conditionalTrigger: item.conditionalTrigger,
                    conditionalActions: item.conditionalActions,
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
    } catch (err) {
        // Item/submission stamp-out failed after the instance itself was already persisted. Left
        // alone, this instance would be a permanent orphan: it has no items to complete, yet its
        // (definitionId, storeId, periodKey) now "exists", so no later sweep tick would ever retry
        // stamping out this store's items for this period. Delete it so the next tick starts clean.
        await ChecklistInstance.deleteOne({ _id: instance._id })
        await ChecklistInstanceItem.deleteMany({ instanceId: instance._id })
        throw err
    }

    return instance
}

// Stamps out the currently-due ChecklistInstance for one definition, across every store it's live
// in — one independent instance per store, or does nothing if its period hasn't arrived yet.
// Shared by the sweep below and by checklistDefinition.service.ts's create() — a freshly-created,
// already-due definition gets its first instance(s) immediately instead of waiting for the next
// hourly tick. Returns the list of newly-created instances (empty if none were due/new).
export const generateInstanceForDefinition = async (definition: HydratedDocument<any>, now: Date) => {
    const period = getCurrentPeriod(definition.recurrence, definition.startDate, now, env.CHECKLIST_TIMEZONE_OFFSET_MINUTES)
    if (!period) return []

    const storeIds = definition.storeIds ?? []
    if (!storeIds.length) return []

    // One query covering every store this definition is live in, instead of one
    // "already generated?" existence check per store.
    const alreadyGeneratedStoreIds = await ChecklistInstance.find({
        definitionId: definition._id,
        storeId: { $in: storeIds },
        periodKey: period.periodKey,
    }).distinct("storeId")
    const alreadyGeneratedSet = new Set(alreadyGeneratedStoreIds.map(String))
    const pendingStoreIds = storeIds.filter((storeId: unknown) => !alreadyGeneratedSet.has(String(storeId)))
    if (!pendingStoreIds.length) return []

    // Definition items are identical for every store — fetch them once here instead of
    // re-querying per store inside generateInstanceForStore.
    const items = await ChecklistDefinitionItem.find({ definitionId: definition._id }).sort({ order: 1 })

    const created = []
    for (const storeId of pendingStoreIds) {
        // Each store is isolated in its own try/catch — one store's failure (bad data, a
        // transient DB error) must not stop the rest of this definition's stores from getting
        // their instance this tick.
        try {
            const instance = await generateInstanceForStore(definition, storeId, period, now, items)
            if (instance) created.push(instance)
        } catch (err) {
            console.error(`Checklist instance generation failed for definition ${definition._id}, store ${storeId}:`, err)
        }
    }

    // A ONE_TIME definition has exactly one period, ever — deactivate it once generated (in at
    // least one store) so the sweep doesn't keep re-checking it forever.
    if (definition.recurrence === "ONE_TIME" && created.length) {
        definition.isActive = false
        await definition.save()
    }

    return created
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
