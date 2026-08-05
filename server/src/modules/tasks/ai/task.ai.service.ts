import { GoogleGenAI , Type } from "@google/genai";
import { User } from "../../../models/User.js";
import { Department } from "../../../models/Department.js";

const ai = new GoogleGenAI({ apiKey : process.env.GEMINI_API_KEY!});

const EXTRACTION_SCHEMA = {
    type : Type.OBJECT,
    properties : {
        title : { type : Type.STRING, description : "Short, imperative task title"},
        context : { type : Type.STRING, description : "Any additional context or details about the task, in a single paragraph"},
        assigneeName : { type : Type.STRING, description : "The person's name as spoken, or empty string if none mentioned"},
        department : { type : Type.STRING, description : "The department name as spoken, or empty string if none mentioned"},
        dueDateISO : { type : Type.STRING, description : "The due date as spoken, or empty string if none mentioned"},
        category : { type : Type.STRING, description : "The priority as spoken, or empty string if none mentioned"},
        confidence : { type : Type.NUMBER, description : "A number between 0 and 1 indicating how confident the model is in its extraction. 0 = not confident at all, 1 = very confident."}
    },
    required : ["title", "context", "assigneeName", "department", "dueDateISO", "category", "confidence"]
};

export interface RawExtraction {
    title : string;
    context : string;
    assigneeName : string;
    department : string;
    dueDateISO : string;
    confidence : number,

}

export async function extractTaskFromText(rawInput : string, referenceDate : Date) : Promise<RawExtraction> {
    const response = await ai.models.generateContent({
        model : "gemini-2.5-flash",
        contents : [
            {
                role : "user",
                parts : [
                    {
                        text : [
                            `Reference date/time (server, for resolving relative dates like "today"/"tomorrow"): ${referenceDate.toISOString()}`,
                            `If no explicit time is mentioned, resolve the due date to 23:59:59 on the resolved day.`,
                            `Extract structured task parameters from this instructions:`,
                            `"""${rawInput}"""`,
                        ].join("\n"),
                    },
                ],
            },
        ],
        config : {
            responseMimeType : "application/json",
            responseSchema : EXTRACTION_SCHEMA ,
        },
    });

    return JSON.parse(response.text ?? "{}" ) as RawExtraction
    
}

const PRIORITY_BY_MAX_RANK : Array<{maxRank : number; priority : "low" | "medium" | "high"}> = [
    { maxRank : 2, priority : "high"}, // ADMIN, MANAGER
    { maxRank : 4, priority : "medium"}, // PC, AGENT
    { maxRank : Infinity, priority : "low"} // USER

];
    
export function priorityForCreatorRank(rank : number) : "low" | "medium" | "high" {
    return PRIORITY_BY_MAX_RANK.find((tier) => rank <= tier.maxRank)?.priority ?? "low";
}

const RELATIVE_DATE_RESOLVERS : Record<string, (ref : Date) => Date> = {
    today : (ref) => ref,
    tomorrow : (ref) => new Date(ref.getTime() + 86_400_000)

}

export function resolveDueDate(dueDateISO : string, rawInput : string, referenceDate : Date) : Date {
    const parsed = new Date(dueDateISO);
    if(!Number.isNaN(parsed.getTime())){
        parsed.setHours(23, 59, 59, 999);
        return parsed;
    }
    const keyword = Object.keys(RELATIVE_DATE_RESOLVERS).find((k) => rawInput.toLowerCase().includes(k))
    const resolved = keyword ? RELATIVE_DATE_RESOLVERS[keyword](referenceDate) : referenceDate;
    resolved.setHours(23, 59, 59, 999);
    return resolved;
}

export async function resolveAssignee(name : string, departmentHint?: string) {
    if(!name) return null;
    const departmentFilter = departmentHint ? { departmentId : ( await Department.findOne({ name : new RegExp(departmentHint, "i")})) ?._id} : {};

    const nameParts = name.trim().split(/\s+/)
    return User.findOne({
        isActive : true,
        ...departmentFilter,
        $or : nameParts.map((part) => ({ firstName : new RegExp(`^${part}`, "i") })),

    })
}