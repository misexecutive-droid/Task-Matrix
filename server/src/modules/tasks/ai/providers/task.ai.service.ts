import { User } from "../../../../models/User.js";
import { Department } from "../../../../models/Department.js";
import { extractWithClaude } from "./claude.provider.js";
import { extractWithGemini } from "./gemini.provider.js";
import { extractWithOpenAI } from "./openai.provider.js";
import type { RawExtraction } from "../schema.js";

const PROVIDERS = [
    { name: "claude", run: extractWithClaude },
    { name: "openai", run: extractWithOpenAI },
    { name: "gemini", run: extractWithGemini }
] as const;

const TIEBREAK_RANK: Record<string, number> = { claude: 3, openai: 2, gemini: 1 }

export interface EnsembleResult extends RawExtraction {
    wonBy: string;
    providerResults: Array<{ provider: string; ok: boolean; confidence?: number; error?: string }>;
}

type ProviderRun = { provider: (typeof PROVIDERS)[number]["name"]; result: RawExtraction };

export async function extractTaskFromText(rawInput: string, referenceDate: Date): Promise<EnsembleResult> {
    const settled = await Promise.allSettled(
        PROVIDERS.map((p) => p.run(rawInput, referenceDate).then((result) => ({ provider: p.name, result })))
    );

    const succeeded = settled
        .map((s) => (s.status === "fulfilled" ? s.value : null))
        .filter((v): v is ProviderRun => v !== null);


    if (succeeded.length === 0) {
        throw new Error("All AI providers failed to extract task parameters")
    }

    const winner = succeeded.reduce((best, candidate) => {
        if (candidate.result.confidence !== best.result.confidence) {
            return candidate.result.confidence > best.result.confidence ? candidate : best;
        }
        return TIEBREAK_RANK[candidate.provider] > TIEBREAK_RANK[best.provider] ? candidate : best;
    });

    const providerResults = settled.map((s, i) => {
        const name = PROVIDERS[i].name;
        return s.status === "fulfilled" ? { provider: name, ok: true, confidence: s.value.result.confidence }
            : { provider: name, ok: false, error: (s.reason as Error).message }
    });

    return { ...winner.result, wonBy: winner.provider, providerResults }

}

const PRIORITY_BY_MAX_RANK: Array<{ maxRank: number; priority: "low" | "medium" | "high" }> = [
    { maxRank: 2, priority: "high" },
    { maxRank: 4, priority: "medium" },
    { maxRank: Infinity, priority: "low" }
]

export function priorityForCreatorRank(rank: number): "low" | "medium" | "high" {
    return PRIORITY_BY_MAX_RANK.find((tier) => rank <= tier.maxRank)!.priority
}

const RELATIVE_DATE_RESOLVERS: Record<string, (ref: Date) => Date> = {
    today: (ref) => ref,
    tomorrow: (ref) => new Date(ref.getTime() + 86_400_000),

};

export function resolveDueDate(dueDateISO: string, rawInput: string, referenceDate: Date): Date {
    const parsed = new Date(dueDateISO);
    if (!Number.isNaN(parsed.getTime())) {
        parsed.setHours(23,59,59,999)
        return parsed;
    }

    const keyword = Object.keys(RELATIVE_DATE_RESOLVERS).find((k) => rawInput.toLocaleLowerCase().includes(k))
    const resolved = keyword ? RELATIVE_DATE_RESOLVERS[keyword](referenceDate) : referenceDate;
    resolved.setHours(23, 59, 59, 999);
    return resolved;
}

export async function resolveAssignee(name: string, departmentHint?: string) {
    if (!name) return null;
    const departmentFilter = departmentHint ? { departmentId: (await Department.findOne({ name: new RegExp(departmentHint, "i") }))?._id } : {};

    const nameParts = name.trim().split(/\s+/);
    return User.findOne({
        isActive: true,
        ...departmentFilter,
        $or: nameParts.map((part) => ({ firstName: new RegExp(`^${part}`, "i") })),


    })

}

