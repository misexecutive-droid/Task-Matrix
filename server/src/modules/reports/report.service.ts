import { Ticket } from "../../models/Ticket.js";
import { Task } from "../../models/Task.js";
import { ChecklistInstance } from "../../models/ChecklistInstance.js";
import type { CsvColumn } from "../../utils/csv.js";

export type ReportModule = "tickets" | "tasks" | "checklists";

const dateFilter = (field: string, from?: string, to?: string) => {
    if (!from && !to) return {};
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    return { [field]: range };
};

// Mirrors TaskList's own filter bar (taskFilters.ts's CATEGORY_PREDICATES) so "Export" downloads
// exactly what's on screen, not the whole table — "delegation"/"task" both store category
// "delegation" on the Task document, split by whether aiMeta was recorded (AI/WhatsApp-created vs
// typed into the New Task form).
export type TaskExportFilters = {
    category?: "issue" | "delegation" | "task";
    status?: string;
    priority?: string[];
    departmentId?: string;
    assigneeIds?: string[];
};

const taskExtraFilter = (extra?: TaskExportFilters) => {
    if (!extra) return {};
    const query: Record<string, unknown> = {};

    if (extra.category === "issue") query.category = "issue";
    else if (extra.category === "delegation") {
        query.category = "delegation";
        query.aiMeta = { $ne: null };
    } else if (extra.category === "task") {
        query.category = "delegation";
        query.aiMeta = null;
    }

    if (extra.status) query.status = extra.status;
    if (extra.priority?.length) query.priority = { $in: extra.priority };
    if (extra.departmentId) query.departmentId = extra.departmentId;
    if (extra.assigneeIds?.length) {
        query.$or = [
            { assigneeId: { $in: extra.assigneeIds } },
            { additionalAssigneeIds: { $in: extra.assigneeIds } },
        ];
    }

    return query;
};

const fullName = (person: { firstName?: string; lastName?: string | null } | null | undefined) =>
    person ? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() : "";

const isoOrEmpty = (value: unknown) => (value ? new Date(value as string).toISOString() : "");

export const TICKET_COLUMNS: CsvColumn[] = [
    { key: "id", label: "Ticket ID" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "department", label: "Department" },
    { key: "assignee", label: "Assignee" },
    { key: "raisedBy", label: "Raised By" },
    { key: "createdAt", label: "Created At" },
    { key: "closedAt", label: "Closed At" },
    { key: "tatHours", label: "TAT (hrs)" },
    { key: "isOverdue", label: "Overdue" },
];

export const TASK_COLUMNS: CsvColumn[] = [
    { key: "id", label: "Task ID" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "department", label: "Department" },
    { key: "assignee", label: "Assignee" },
    { key: "raisedBy", label: "Raised By" },
    { key: "dueDate", label: "Due Date" },
    { key: "createdAt", label: "Created At" },
];

export const CHECKLIST_COLUMNS: CsvColumn[] = [
    { key: "id", label: "Instance ID" },
    { key: "title", label: "Checklist" },
    { key: "recurrence", label: "Recurrence" },
    { key: "store", label: "Store" },
    { key: "assignees", label: "Assignees" },
    { key: "periodStart", label: "Period Start" },
    { key: "periodEnd", label: "Period End" },
    { key: "itemsDone", label: "Items Done" },
    { key: "itemsTotal", label: "Items Total" },
    { key: "isCompleted", label: "Completed" },
];

export const REPORT_COLUMNS: Record<ReportModule, CsvColumn[]> = {
    tickets: TICKET_COLUMNS,
    tasks: TASK_COLUMNS,
    checklists: CHECKLIST_COLUMNS,
};


export const reportService = {
    async *ticketRows(from?: string, to?: string, _extra?: TaskExportFilters) {
        const cursor = Ticket.find(dateFilter("createAt", from, to))
            .populate({ path: "assignee", select: "firstamNe lastName" })
            .populate({ path: "raisedBy", select: "firstName lastName" })
            .populate({ path: "departmentId", select: "name" })
            .sort({ createdAt: -1 })
            .lean()
            .cursor();

        for await (const t of cursor as any) {
            yield {
                id: t._id.toSring(),
                title: t.title,
                status: t.status,
                priority: t.priority,
                department: t.departmentId?.name ?? "",
                assignee: fullName(t.assignee),
                raisedBy: fullName(t.raisedBy),
                createAt: isoOrEmpty(t.createdAt),
                tatHours: t.tatHours ?? "",
                isOverdue: t.isOverdue ? "Yes" : "No",
            }
        }
    },

    async *taskRows(from?: string, to?: string, extra?: TaskExportFilters) {
        const cursor = Task.find({ ...dateFilter("createdAt", from, to), ...taskExtraFilter(extra) })
            .populate({ path: "assigneeId", select: "firstName lastName" })
            .populate({ path: "additionalAssigneeIds", select: "firstName lastName" })
            .populate({ path: "userId", select: "firstName lastName" })
            .populate({ path: "departmentId", select: "name" })
            .sort({ createAt: -1 })
            .lean()
            .cursor()


        for await (const t of cursor as any) {
            // A task can have a primary assignee plus extra ones (additionalAssigneeIds) — list
            // everyone, not just the primary, so a two-person task doesn't silently show one name.
            const assigneeNames = [t.assigneeId, ...(t.additionalAssigneeIds ?? [])]
                .map(fullName)
                .filter(Boolean);

            yield {
                id: t._id.toString(),
                title: t.title,
                status: t.status,
                priority: t.priority,
                department: t.departmentId?.name ?? "",
                assignee: assigneeNames.join(", "),
                raisedBy: fullName(t.userId),
                dueDate: isoOrEmpty(t.dueDate),
                createdAt: isoOrEmpty(t.createdAt)
            }
        }
    },

    async *checklistRows(from?: string, to?: string, _extra?: TaskExportFilters) {
        const cursor = ChecklistInstance.find(dateFilter("periodStart", from, to))
            .populate({ path: "storeId", select: "name" })
            .populate({ path: "assigneeIds", select: "firstName lastName" })
            .populate({ path: "items" })
            .sort({ periodStart: -1 })
            .lean()
            .cursor();

        for await (const inst of cursor as any) {
            const items = inst.items ?? [];
            const itemsDone = items.filter((i: any) => i.isDone).length;
            const itemsTotal = items.length;

            yield {
                id: inst._id.toString(),
                title: inst.title,
                recurrence: inst.recurrence,
                store: inst.storeId?.name ?? "",
                assignees: (inst.assigneeIds ?? []).map(fullName).join(", "),
                periodStart: isoOrEmpty(inst.periodStart),
                periodEnd: isoOrEmpty(inst.periodEnd),
                itemsDone,
                itemsTotal,
                isCompleted: itemsTotal > 0 && itemsDone === itemsTotal ? "Yes" : "No"
            }
        }
    },

};

export const REPORT_ROW_STREAMS: Record<ReportModule, (from?: string, to?: string, extra?: TaskExportFilters) => AsyncGenerator<Record<string, unknown>>> = {
    tickets: reportService.ticketRows,
    tasks: reportService.taskRows,
    checklists: reportService.checklistRows,

}

// export const reportService = {
//     // Every ticket created within [from, to] — admin-only export, so no RBAC visibility filter
//     // is applied (mirrors ticketService.tatReport, which is also an ADMIN-gated, all-tickets view).
//     async ticketRows(from?: string, to?: string) {
//         const tickets: any[] = await Ticket.find(dateFilter("createdAt", from, to))
//             .populate({ path: "assignee", select: "firstName lastName" })
//             .populate({ path: "raisedBy", select: "firstName lastName" })
//             .populate({ path: "departmentId", select: "name" })
//             .sort({ createdAt: -1 })
//             .lean();

//         return tickets.map((t) => ({
//             id: t._id.toString(),
//             title: t.title,
//             status: t.status,
//             priority: t.priority,
//             department: t.departmentId?.name ?? "",
//             assignee: fullName(t.assignee),
//             raisedBy: fullName(t.raisedBy),
//             createdAt: isoOrEmpty(t.createdAt),
//             closedAt: isoOrEmpty(t.closedAt),
//             tatHours: t.tatHours ?? "",
//             isOverdue: t.isOverdue ? "Yes" : "No",
//         }));
//     },

//     async taskRows(from?: string, to?: string) {
//         const tasks: any[] = await Task.find(dateFilter("createdAt", from, to))
//             .populate({ path: "assigneeId", select: "firstName lastName" })
//             .populate({ path: "userId", select: "firstName lastName" })
//             .populate({ path: "departmentId", select: "name" })
//             .sort({ createdAt: -1 })
//             .lean();

//         return tasks.map((t) => ({
//             id: t._id.toString(),
//             title: t.title,
//             status: t.status,
//             priority: t.priority,
//             department: t.departmentId?.name ?? "",
//             assignee: fullName(t.assigneeId),
//             raisedBy: fullName(t.userId),
//             dueDate: isoOrEmpty(t.dueDate),
//             createdAt: isoOrEmpty(t.createdAt),
//         }));
//     },

//     // Checklist INSTANCES (the actual occurrences), not definitions/templates — those are what a
//     // daily/weekly/monthly/quarterly/yearly report is actually about. "Completed" is derived the
//     // same way checklistInstanceService.isCompleted does: every item done, and at least one item.
//     async checklistRows(from?: string, to?: string) {
//         const instances: any[] = await ChecklistInstance.find(dateFilter("periodStart", from, to))
//             .populate({ path: "departmentId", select: "name" })
//             .populate({ path: "assigneeIds", select: "firstName lastName" })
//             .populate({ path: "items" })
//             .sort({ periodStart: -1 })
//             .lean();

//         return instances.map((inst) => {
//             const items = inst.items ?? [];
//             const itemsDone = items.filter((i: any) => i.isDone).length;
//             const itemsTotal = items.length;
//             return {
//                 id: inst._id.toString(),
//                 title: inst.title,
//                 recurrence: inst.recurrence,
//                 department: inst.departmentId?.name ?? "",
//                 assignees: (inst.assigneeIds ?? []).map(fullName).join(", "),
//                 periodStart: isoOrEmpty(inst.periodStart),
//                 periodEnd: isoOrEmpty(inst.periodEnd),
//                 itemsDone,
//                 itemsTotal,
//                 isCompleted: itemsTotal > 0 && itemsDone === itemsTotal ? "Yes" : "No",
//             };
//         });
//     },
// };

// export const REPORT_ROW_FETCHERS: Record<ReportModule, (from?: string, to?: string) => Promise<Record<string, unknown>[]>> = {
//     tickets: reportService.ticketRows,
//     tasks: reportService.taskRows,
//     checklists: reportService.checklistRows,
// };


