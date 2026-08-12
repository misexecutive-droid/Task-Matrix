// Shared low-level date-text primitives — used by both task.ai.service.ts's resolveDueDate
// (parses AI-extracted text, ISO-first) and slotFilling.ts's resolveDueDateLocally (parses a raw
// conversational answer, fuzzy-word-first). The two callers have different input contracts so
// they stay separate functions, but the weekday list and day-math they both need are identical
// and are kept here as the one source of truth instead of two hand-kept copies.

export const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const IN_DAYS_PATTERN = /\bin\s+(\d+)\s+days?\b/

// Number of days from now until the given weekday, always moving forward (0 would mean "today",
// which we never want here — a same-day match should mean "next week", hence `|| 7`).
export const daysUntilWeekday = (currentDay: number, targetDay: number): number =>
    (targetDay + 7 - currentDay) % 7 || 7

export const matchInDays = (text: string): number | null => {
    const match = text.toLowerCase().match(IN_DAYS_PATTERN)
    return match ? Number(match[1]) : null
}
