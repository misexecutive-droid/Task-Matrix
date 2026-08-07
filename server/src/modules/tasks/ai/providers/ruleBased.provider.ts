import { User } from "../../../../models/User.js"
import { Department } from "../../../../models/Department.js"
import type { RawExtraction } from "../schema.js"

const ISSUE_KEYWORDS = ["issue", "problem", "broken", "not working", "bug", "error", "fault", "complaint"]

const DATE_HINT_PATTERN = /\btoday\b|\btomorrow\b|\bin\s+\d+\s+days?\b|\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b|\bsaturday\b|\bsunday\b/i;


export async function extractWithRules(rawInput: string, _referenceDate: Date): Promise<RawExtraction> {
    const lower = rawInput.toLocaleLowerCase();
    let confidence = 0.4;

    const [users, departments] = await Promise.all([
        User.find({ isActive: true }).select("firstName"),
        Department.find({ isActive: true }).select("name"),

    ]);

    const matchedUser = users.find((u) => u.firstName && new RegExp(`\\b${u.firstName}\\b`, "i").test(rawInput))
    if (matchedUser) confidence += 0.25;

    const matchedDept = departments.find((d) => d.name && new RegExp(`\\b${d.name}\\b`, "i")?.test(rawInput))
    if (matchedDept) confidence += 0.15;

    if (DATE_HINT_PATTERN.test(rawInput)) confidence += 0.15;

    const category = ISSUE_KEYWORDS.some((kw) => lower.includes(kw)) ? "issue" : "delegated_task"

    return {
        title: rawInput.trim(),
        context: "",
        assigneeName: matchedUser?.firstName ?? "",
        department: matchedDept?.name ?? "",
        dueDateISO: "",
        category,
        confidence: Math.min(confidence, 0.9),

    }

}