import { AppError } from "./AppError.js"

// Shared by ticket.service.ts and task.service.ts: blocks a status transition (into review/
// pending-verification) until every not-done checklist item has a "remarks" explanation.
// `checklists` is an array of populated checklist documents, each with a populated `items` array.
export const assertChecklistsResolved = (checklists: any[], actionLabel: string) => {
    const incomplete = (checklists ?? [])
        .flatMap((cl: any) => cl.items ?? [])
        .filter((item: any) => !item.isDone && !item.remarks?.trim())

    if (incomplete.length) {
        throw AppError.badRequest(
            `Add remarks explaining why these checklist items aren't done before ${actionLabel}: ${incomplete.map((i: any) => i.label).join(", ")}`,
        )
    }
}
