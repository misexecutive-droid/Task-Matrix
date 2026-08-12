export type DateBucket = "hour" | "day" | "week" | "month" | "year"

// Mongo $dateToString format string for each report grouping granularity — shared by every
// report method that buckets documents by time (tasks, tickets, checklist instances).
export const DATE_FORMATS: Record<DateBucket, string> = {
    hour: '%Y-%m-%dT%H:00',
    day: '%Y-%m-%d',
    week: '%G-W%V',
    month: '%Y-%m',
    year: '%Y',
}
