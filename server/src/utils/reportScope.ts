import type { AccessTokenPayload } from "../middleware/auth/auth.js"
import { Department } from "../models/Department.js"

export interface ReportScope {
    departmentId?: string;
    storeId?: string;
}

// Resolves the department/store scope a caller is allowed to see on an org-wide report.
// ADMIN/PC may request any explicit scope (or none, for org-wide). MANAGER is forced to their
// own department; SENIOR is forced to their own store. Every other role gets no scope at all —
// callers that need a "just my own records" fallback (e.g. task compliance for AGENT/USER)
// handle that separately, since it isn't a department/store concept.
//
// Note: a report whose model has no departmentId (or no storeId) field just won't have that key
// read off the returned object by its caller, so e.g. a SENIOR resolves to a store scope here but
// a caller that only destructures `departmentId` (task compliance) naturally falls back to
// org-wide for them — same for MANAGER on a store-only report like checklist compliance.
export const resolveReportScope = (user: AccessTokenPayload, requested: ReportScope): ReportScope => {
    if (user.role === "ADMIN" || user.role === "PC") return requested;
    if (user.role === "MANAGER") return { departmentId: user.departmentId };
    if (user.role === "SENIOR") return { storeId: user.storeId };
    return {};
};

// Department optionally belongs to a Store (Department.storeId — see models/Department.ts).
// These two helpers use that link to give a report scoped to the *other* dimension a real
// answer instead of an org-wide fallback: a SENIOR (store-scoped) can't filter Task directly
// (it has no storeId), so we resolve every department in their store instead; a MANAGER
// (department-scoped) can't filter ChecklistInstance directly (it has no department concept),
// so we resolve their department's home store instead. Both degrade to their prior org-wide
// behavior when the relevant department has no store assigned yet.

export const resolveDepartmentIdsForStore = async (storeId: string): Promise<string[]> => {
    const departments = await Department.find({ storeId }).select("_id").lean();
    return departments.map((d) => d._id.toString());
};

export const resolveStoreIdForDepartment = async (departmentId: string): Promise<string | undefined> => {
    const department = await Department.findById(departmentId).select("storeId").lean();
    return department?.storeId ? department.storeId.toString() : undefined;
};
