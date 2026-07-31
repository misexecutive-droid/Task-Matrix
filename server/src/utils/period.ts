import type { ChecklistRecurrence } from "../models/ChecklistDefinition.js"

// Pure date math for the checklist recurrence engine. Everything here operates on UTC calendar
// days — no timezone-of-the-org configurability yet (see plan's "explicitly deferred" list).

export type Period = { periodKey: string; periodStart: Date; periodEnd: Date }

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Truncates a Date to UTC midnight of its calendar day, discarding time-of-day. `offsetMinutes` is
// the org's local-timezone offset ahead of UTC — shifting by it before reading the calendar day
// turns "UTC calendar day" into "org's local calendar day", which is what admins actually mean by
// "today" when they pick a startDate from a plain <input type="date"> (itself parsed as UTC
// midnight, so without this shift a local "today" can still read as UTC "yesterday" for several
// hours after local midnight).
const toDateOnlyUTC = (date: Date, offsetMinutes: number): Date => {
    const shifted = new Date(date.getTime() + offsetMinutes * 60_000)
    return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
}

const addDaysUTC = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
}

// Adds `months` calendar months to `date`, clamping the day-of-month to the last valid day of the
// resulting month (e.g. a Jan-31 anchor + 1 month clamps to Feb-28/29, not rolling into March).
const addMonthsClamped = (date: Date, months: number): Date => {
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + months
    const day = date.getUTCDate()
    const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)))
}

const daysBetweenUTC = (from: Date, to: Date): number => Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY)

const monthsBetweenUTC = (from: Date, to: Date): number =>
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())

// YYYY-MM-DD of a UTC date-only Date — the periodKey format for every recurrence except ONE_TIME.
const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10)

// DAILY (stepDays=1) / WEEKLY (stepDays=7): finds how many whole `stepDays`-sized blocks have
// elapsed since the anchor date, and returns that block's start/end.
const steppedDayPeriod = (anchor: Date, today: Date, stepDays: number): Period | null => {
    if (today < anchor) return null
    const elapsedDays = daysBetweenUTC(anchor, today)
    const periods = Math.floor(elapsedDays / stepDays)
    const periodStart = addDaysUTC(anchor, periods * stepDays)
    return { periodKey: formatDateKey(periodStart), periodStart, periodEnd: addDaysUTC(periodStart, stepDays) }
}

// MONTHLY (stepMonths=1) / QUARTERLY (3) / YEARLY (12): same idea in month units, with
// day-of-month clamping so short months don't overshoot into the next period.
const steppedMonthPeriod = (anchor: Date, today: Date, stepMonths: number): Period | null => {
    if (today < anchor) return null
    const monthsElapsed = monthsBetweenUTC(anchor, today)
    let periods = Math.floor(monthsElapsed / stepMonths)
    let periodStart = addMonthsClamped(anchor, periods * stepMonths)
    // monthsBetweenUTC ignores day-of-month, so the clamped periodStart can land after `today`
    // (e.g. anchor day-of-month is later than today's) — step back one period when that happens.
    if (today < periodStart) {
        periods -= 1
        periodStart = addMonthsClamped(anchor, periods * stepMonths)
    }
    const periodEnd = addMonthsClamped(anchor, (periods + 1) * stepMonths)
    return { periodKey: formatDateKey(periodStart), periodStart, periodEnd }
}

const ONE_TIME_KEY = "ONE_TIME"

// Returns the currently-due period for a definition's recurrence, or null if its startDate is
// still in the future (nothing to generate yet). `now` is passed in rather than read internally
// so callers (and tests) can pin a fixed instant. `offsetMinutes` is the org's local-timezone
// offset ahead of UTC (env.CHECKLIST_TIMEZONE_OFFSET_MINUTES) — see toDateOnlyUTC above.
export const getCurrentPeriod = (recurrence: ChecklistRecurrence, startDate: Date, now: Date, offsetMinutes: number): Period | null => {
    const anchor = toDateOnlyUTC(startDate, offsetMinutes)
    const today = toDateOnlyUTC(now, offsetMinutes)

    switch (recurrence) {
        case "DAILY":
            return steppedDayPeriod(anchor, today, 1)
        case "WEEKLY":
            return steppedDayPeriod(anchor, today, 7)
        case "MONTHLY":
            return steppedMonthPeriod(anchor, today, 1)
        case "QUARTERLY":
            return steppedMonthPeriod(anchor, today, 3)
        case "YEARLY":
            return steppedMonthPeriod(anchor, today, 12)
        case "ONE_TIME":
            if (today < anchor) return null
            return { periodKey: ONE_TIME_KEY, periodStart: anchor, periodEnd: addDaysUTC(anchor, 1) }
    }
}
