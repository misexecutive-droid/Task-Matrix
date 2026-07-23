// Recurrence engine for the Checklist feature: sweeps active ChecklistDefinitions and stamps
// out a fresh, completable ChecklistInstance whenever a definition's current period hasn't been
// generated yet. See utils/period.ts for the period-math this relies on.
import cron from "node-cron"
import { ChecklistDefinition } from "../models/ChecklistDefinition.js"
import { ChecklistDefinitionItem } from "../models/ChecklistDefinitionItem.js"
import { ChecklistInstance } from "../models/ChecklistInstance.js"
import { ChecklistInstanceItem } from "../models/ChecklistInstanceItem.js"
import { getCurrentPeriod } from "../utils/period.js"

const generateDueInstances = async () => {
    const now = new Date()
    const definitions = await ChecklistDefinition.find({ isActive: true, startDate: { $lte: now } })

    for (const definition of definitions) {
        // Each definition is isolated in its own try/catch — one bad/malformed definition must
        // not abort the sweep for the rest, unlike the single-collection slaSweep job.
        try {
            const period = getCurrentPeriod(definition.recurrence, definition.startDate, now)
            if (!period) continue

            const alreadyGenerated = await ChecklistInstance.exists({
                definitionId: definition._id,
                periodKey: period.periodKey,
            })
            if (alreadyGenerated) continue

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
                if (err?.code === 11000) continue
                throw err
            }

            const items = await ChecklistDefinitionItem.find({ definitionId: definition._id }).sort({ order: 1 })
            if (items.length) {
                await ChecklistInstanceItem.insertMany(
                    items.map((item, index) => ({
                        label: item.label,
                        order: item.order ?? index,
                        instanceId: instance._id,
                    })),
                )
            }

            // A ONE_TIME definition has exactly one period, ever — deactivate it once generated
            // so the sweep doesn't keep re-checking it forever.
            if (definition.recurrence === "ONE_TIME") {
                definition.isActive = false
                await definition.save()
            }
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
