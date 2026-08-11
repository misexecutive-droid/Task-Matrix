import { useState, useRef, useEffect, useCallback, } from "react";
import { useAssignableUsersQuery, useCreateSmartTaskMutation, useParseSmartTaskMutation } from "./hook";
import { useDepartmentsQuery } from "../tickets/hook";
import { toast } from "sonner";
import { Calendar, Sparkles, Send, User as UserIcon, } from "lucide-react";
import { Button, Input, Modal, Textarea } from "@/components";
import { useConfirm } from "@/components/confirmDialog";
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from "./taskFormFieldStyles";
import { TaskFormPrioritySelector } from "./TaskFormPrioritySelector";
import { TaskFormDepartmentField } from "./TaskFormDepartmentField";
import { TaskFormAssigneeField } from "./TaskFormAssigneeField";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";
import type { SmartTaskParseResult } from "@/api/task";
import type { Department } from "@/api/departments";
import type { AssignableUser } from "@/api/users";

interface SmartTaskModalProps {
    onClose: () => void;
}

type ChatMessage = { id: string; from: "bot" | "user"; text: string; timestamp: number };
type Slot = "assignee" | "department" | "dueDate" | "priority";

const SLOT_ORDER: readonly Slot[] = ["assignee", "department", "dueDate", "priority"] as const;

const SLOT_QUESTIONS: Record<Slot, string> = {
    assignee: "Who should I assign this task to?",
    department: "Which department does this belong to?",
    dueDate: "When is this task due?",
    priority: "Should this be low, medium, or high priority?",
};

type Draft = {
    title: string;
    context: string;
    category: "issue" | "delegated_task";
    priority: "low" | "medium" | "high";
    dueDate: Date | null;
    assigneeId: string;
    assigneeName: string;
    departmentId: string;
    departmentName: string;
};

type ReviewState = {
    title: string;
    context: string;
    category: "issue" | "delegated_task";
    priority: "low" | "medium" | "high";
    dueDate: string;
    assigneeId: string;
    departmentId: string;
};

const DATE_HINT_PATTERN = /\b(today|tomorrow|in\s+\d+\s+days?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|aaj|kal|\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// Priority is never actually extracted from the message today — the server just defaults it from
// the creator's rank (priorityForCreatorRank), so "urgent, fix this" and "no rush, whenever" were
// both silently ignored. This mirrors DATE_HINT_PATTERN's approach: only trust an unprompted
// mention in the free-form initial message when it's an unambiguous keyword (avoids a task whose
// description merely contains the word "critical" for unrelated reasons silently going high-prio);
// otherwise fall through to asking, same as a missing due date does.
const PRIORITY_HINT_PATTERN = /\b(urgent|asap|immediately|critical|very important|high priority|top priority|low priority|not urgent|no rush|medium priority)\b/i;
const HIGH_PRIORITY_HINT_PATTERN = /\b(urgent|asap|immediately|critical|very important|high priority|top priority)\b/i;

const derivePriorityHint = (text: string): Draft["priority"] | null => {
    if (!PRIORITY_HINT_PATTERN.test(text)) return null;
    const lower = text.toLowerCase();
    if (HIGH_PRIORITY_HINT_PATTERN.test(lower)) return "high";
    if (/\b(low priority|not urgent|no rush)\b/.test(lower)) return "low";
    return "medium";
};

// A meta-instruction to skip the "Create this task?" confirmation and create immediately once
// review is ready — distinct from "create" appearing as the task's own content verb (e.g. "create
// a task for Harsh", which is how most messages phrase their intent anyway and must NOT trigger
// this). Requires "it"/"this"/"now" directly after "create", led by an imperative ("please"/
// "just"/"go ahead"), or an explicit ask to skip confirmation outright.
const SKIP_CONFIRMATION_PATTERN =
    /\b(please|just|go ahead(?:\s+and)?)\s+create\s+(it|this|now)\b|\bcreate\s+it\s+(now|directly|right away)\b|\bskip\s+(the\s+)?confirmation\b|\bwithout\s+confirmation\b|\bdon'?t\s+ask,?\s+(just\s+)?create\b/i;

// Helper: Secure ID Generator avoiding global closure leaks
const createId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Fast Local In-Memory Matching Functions
const findUserByName = (query: string, users?: AssignableUser[]): AssignableUser | undefined => {
    const cleanQuery = query.replace(/\b(assign|to|for)\b/gi, "").trim().toLowerCase();
    if (!cleanQuery || !users?.length) return undefined;

    return users.find((u) => {
        const fullName = `${u.firstName} ${u.lastName ?? ""}`.trim().toLowerCase();
        return fullName.includes(cleanQuery) || u.firstName.toLowerCase().startsWith(cleanQuery);
    });
};

const findDepartmentByName = (query: string, departments?: Department[]): Department | undefined => {
    const cleanQuery = query.replace(/\b(department|dept|team)\b/gi, "").trim().toLowerCase();
    if (!cleanQuery || !departments?.length) return undefined;

    return departments.find((d) => d.name.toLowerCase().includes(cleanQuery));
};

// Chat input is typed quickly and typo-prone ("tommorow", "tomorow") — an exact .includes() check
// silently misses those, and previously fell all the way through to Date.parse returning NaN and
// defaulting to *today*, which looks like a correct answer instead of a failure to understand one.
// Levenshtein distance catches common misspellings without needing to hand-list every variant.
const levenshteinDistance = (a: string, b: string): number => {
    const rows: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) rows[i][0] = i;
    for (let j = 0; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            rows[i][j] = a[i - 1] === b[j - 1]
                ? rows[i - 1][j - 1]
                : 1 + Math.min(rows[i - 1][j - 1], rows[i - 1][j], rows[i][j - 1]);
        }
    }
    return rows[a.length][b.length];
};

const containsFuzzyWord = (text: string, keyword: string, maxDistance = 2): boolean =>
    text.split(/\s+/).some((word) => levenshteinDistance(word, keyword) <= maxDistance);

// Returns null when the answer genuinely can't be understood, rather than silently guessing —
// callers should admit that ("couldn't understand X") the same way findUserByName/
// findDepartmentByName already admit an unmatched name/department, instead of pretending success.
const resolveDueDateLocally = (answer: string, reference: Date = new Date()): Date | null => {
    const lower = answer.toLowerCase().trim();
    const base = new Date(reference);

    const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
    if (inDaysMatch) {
        base.setDate(base.getDate() + Number(inDaysMatch[1]));
        return base;
    }

    const weekdayIndex = WEEKDAYS.findIndex((w) => containsFuzzyWord(lower, w));
    if (weekdayIndex !== -1) {
        const currentDay = base.getDay();
        const diff = (weekdayIndex + 7 - currentDay) % 7 || 7;
        base.setDate(base.getDate() + diff);
        return base;
    }

    if (containsFuzzyWord(lower, "tomorrow") || lower.includes("kal")) {
        base.setDate(base.getDate() + 1);
        return base;
    }
    if (containsFuzzyWord(lower, "today") || lower.includes("aaj")) {
        return base;
    }

    const parsedTimestamp = Date.parse(answer);
    return Number.isNaN(parsedTimestamp) ? null : new Date(parsedTimestamp);
};

// Separate from derivePriorityHint above: this parses a DIRECT answer to "low, medium, or high?",
// where a bare "high" is the expected response — derivePriorityHint's stricter phrase-matching
// (e.g. requiring "high priority") would miss that entirely.
const resolvePriorityAnswer = (answer: string): Draft["priority"] => {
    const lower = answer.toLowerCase();
    if (/\b(high|urgent|asap|critical)\b/.test(lower)) return "high";
    if (/\b(low|whenever|no rush)\b/.test(lower)) return "low";
    return "medium";
};

// Deterministic Slot Resolution Strategy Pattern
const SLOT_RESOLVERS: Record<
    Slot,
    (
        answer: string,
        draft: Draft,
        ctx: { users?: AssignableUser[]; departments?: Department[] }
    ) => { draft: Draft; ack: string }
> = {
    assignee: (answer, draft, { users }) => {
        const match = findUserByName(answer, users);
        const resolvedName = match ? `${match.firstName} ${match.lastName ?? ""}`.trim() : answer.trim();
        return {
            draft: { ...draft, assigneeId: match?.id ?? "", assigneeName: resolvedName },
            ack: match
                ? `Assigned to ${match.firstName}.`
                : `Couldn't match "${answer}" to an active user. You can pick them manually in review.`,
        };
    },
    department: (answer, draft, { departments }) => {
        const match = findDepartmentByName(answer, departments);
        return {
            draft: { ...draft, departmentId: match?.id ?? "", departmentName: match?.name ?? answer.trim() },
            ack: match
                ? `Department set to ${match.name}.`
                : `Couldn't match "${answer}" to a department. Select one manually below if needed.`,
        };
    },
    dueDate: (answer, draft) => {
        const resolved = resolveDueDateLocally(answer);
        return {
            draft: { ...draft, dueDate: resolved ?? draft.dueDate },
            ack: resolved
                ? `Due date set for ${resolved.toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
                : `Couldn't understand "${answer}" as a date. Set one manually below.`,
        };
    },
    priority: (answer, draft) => {
        const resolved = resolvePriorityAnswer(answer);
        return {
            draft: { ...draft, priority: resolved },
            ack: `Priority set to ${resolved}.`,
        };
    },
};

const buildDraftFromParse = (
    result: SmartTaskParseResult,
    rawText: string,
    users?: AssignableUser[],
    departments?: Department[]
): Draft => {
    const matchedUser = result.assignee?.id
        ? users?.find((u) => u.id === result.assignee?.id)
        : findUserByName(result.assignee?.name ?? "", users);

    const matchedDept = findDepartmentByName(result.departmentRaw ?? "", departments);

    return {
        title: result.title,
        context: result.context,
        category: result.category,
        priority: derivePriorityHint(rawText) ?? result.priority,
        dueDate: DATE_HINT_PATTERN.test(rawText) && result.dueDate ? new Date(result.dueDate) : null,
        assigneeId: matchedUser?.id ?? result.assignee?.id ?? "",
        assigneeName: matchedUser ? `${matchedUser.firstName} ${matchedUser.lastName ?? ""}`.trim() : result.assignee?.name ?? "",
        departmentId: matchedDept?.id ?? "",
        departmentName: matchedDept?.name ?? result.departmentRaw ?? "",
    };
};

const mapDraftToReview = (draft: Draft): ReviewState => ({
    title: draft.title,
    context: draft.context,
    category: draft.category,
    priority: draft.priority,
    dueDate: (draft.dueDate ?? new Date()).toISOString().slice(0, 10),
    assigneeId: draft.assigneeId,
    departmentId: draft.departmentId,
});

export const SmartTaskModal = ({ onClose }: SmartTaskModalProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        {
            id: createId(),
            from: "bot",
            text: 'Tell me what needs to happen — e.g. "Harsh ko MDO department ke liye dashboard banana hai, kal tak."',
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState("");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
    const [pendingQueue, setPendingQueue] = useState<Slot[]>([]);
    const [parsed, setParsed] = useState<SmartTaskParseResult | null>(null);
    const [review, setReview] = useState<ReviewState | null>(null);
    const [awaitingRetry, setAwaitingRetry] = useState(false);
    const [initialInputMode, setInitialInputMode] = useState<"voice" | "text">("text");
    const [voiceRecorderBusy, setVoiceRecorderBusy] = useState(false);
    const [skipConfirmation, setSkipConfirmation] = useState(false);
    const hasAutoPromptedRef = useRef(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    const parseMutation = useParseSmartTaskMutation();
    const confirm = useConfirm();
    const createMutation = useCreateSmartTaskMutation();
    const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
    const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();

    // Scroll to bottom on message update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    const addMessage = useCallback((from: ChatMessage["from"], text: string) => {
        setMessages((prev) => [...prev, { id: createId(), from, text, timestamp: Date.now() }]);
    }, []);

    const finishToReview = useCallback((finalDraft: Draft) => {
        const summary = [
            `"${finalDraft.title}"`,
            `assigned to ${finalDraft.assigneeName || "unassigned"}`,
            finalDraft.departmentName ? `${finalDraft.departmentName} dept` : null,
            `due ${(finalDraft.dueDate ?? new Date()).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
            `${finalDraft.priority} priority`,
        ]
            .filter(Boolean)
            .join(", ");

        const closing = skipConfirmation ? "Creating this now — no confirmation needed." : "Review and tweak if necessary.";
        addMessage("bot", `Here is what I prepared — ${summary}. ${closing}`);
        setReview(mapDraftToReview(finalDraft));
        setPendingSlot(null);
        setPendingQueue([]);
    }, [addMessage, skipConfirmation]);

    const processNextSlotOrFinish = useCallback(
        (queue: Slot[], currentDraft: Draft) => {
            if (queue.length === 0) {
                finishToReview(currentDraft);
                return;
            }
            const [nextSlot, ...remainingQueue] = queue;
            setPendingSlot(nextSlot);
            setPendingQueue(remainingQueue);
            addMessage("bot", SLOT_QUESTIONS[nextSlot]);
        },
        [addMessage, finishToReview]
    );

    const handleInitialParse = useCallback(
        (text: string) => {
            parseMutation.mutate(text, {
                onSuccess: (result) => {
                    setParsed(result);
                    // Urgency ("urgent"/"critical"/"very important") skips confirmation the same
                    // way an explicit "please create it" does — no time to wait on a confirm click
                    // for something the user just flagged as high priority.
                    setSkipConfirmation(SKIP_CONFIRMATION_PATTERN.test(text) || HIGH_PRIORITY_HINT_PATTERN.test(text));
                    const initialDraft = buildDraftFromParse(result, text, assignableUsers, departments);
                    setDraft(initialDraft);

                    const missingSlots = SLOT_ORDER.filter((slot) => {
                        if (slot === "assignee") return !initialDraft.assigneeId && !initialDraft.assigneeName;
                        if (slot === "department") return !initialDraft.departmentId && !initialDraft.departmentName;
                        if (slot === "dueDate") return !initialDraft.dueDate;
                        if (slot === "priority") return derivePriorityHint(text) === null;
                        return false;
                    });

                    processNextSlotOrFinish(missingSlots, initialDraft);
                },
                onError: () => {
                    toast.error("Could not process request. Please try again.");
                    addMessage("bot", "Sorry, I couldn't process that text. Could you rephrase your task?");
                },
            });
        },
        [parseMutation, assignableUsers, departments, processNextSlotOrFinish, addMessage]
    );

    const handleSend = (overrideText?: string) => {
        const trimmedInput = (overrideText ?? input).trim();
        if (!trimmedInput || parseMutation.isPending) return;

        addMessage("user", trimmedInput);
        setInput("");

        if (!pendingSlot || !draft) {
            handleInitialParse(trimmedInput);
            return;
        }

        const { draft: updatedDraft, ack } = SLOT_RESOLVERS[pendingSlot](trimmedInput, draft, {
            users: assignableUsers,
            departments,
        });

        addMessage("bot", ack);
        setDraft(updatedDraft);
        processNextSlotOrFinish(pendingQueue, updatedDraft);
    };

    const handleCreate = useCallback(async () => {
        if (!review || !parsed) return;

        setAwaitingRetry(false);

        // Skipped when the message itself already said e.g. "please create it" — asking to
        // confirm something the user just explicitly asked for is redundant friction, not safety.
        if (!skipConfirmation) {
            const ok = await confirm({
                title: "Create this task?",
                description: `"${review.title}" will be created and assigned right away.`,
                confirmLabel: "Yes, create it",
                cancelLabel: "No, go back",
            });
            if (!ok) {
                setAwaitingRetry(true);
                return;
            }
        }

        createMutation.mutate(
            {
                title: review.title.trim(),
                context: review.context.trim() || undefined,
                category: review.category,
                priority: review.priority,
                dueDate: review.dueDate ? new Date(review.dueDate).toISOString() : parsed.dueDate,
                assigneeId: review.assigneeId || undefined,
                departmentId: review.departmentId || undefined,
                assigneeRaw: parsed.assigneeRaw || undefined,
                departmentRaw: parsed.departmentRaw || undefined,
                confidence: parsed.confidence,
                rawInput: parsed.rawInput,
                inputMode: initialInputMode,
                wonBy: parsed.wonBy,
                channel: "web",
            },
            { onSuccess: onClose }
        );
    }, [review, parsed, confirm, createMutation, initialInputMode, skipConfirmation]);

    useEffect(() => {
        if (review && parsed && !hasAutoPromptedRef.current) {
            hasAutoPromptedRef.current = true;
            handleCreate();
        }
    }, [review, parsed, handleCreate]);

    return (
        <Modal
            open
            onClose={onClose}
            size="xl"
            contentClassName="accent-blue"
            icon={<Sparkles className="w-5 h-5 text-blue-600" />}
            title="Smart Add"
            description={review ? "Review extracted details below before creating." : "Type in English or Hinglish — I'll parse the details."}
            footer={
                review && awaitingRetry && (
                    <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>
                        Confirm &amp; Create
                    </Button>
                )
            }
        >
            <div className="flex flex-col gap-4">
                {/* Chat History Container */}
                <div ref={scrollRef} className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex items-start gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
                            <div className={`flex items-center justify-center size-6 rounded-full shrink-0 ${m.from === "bot" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                {m.from === "bot" ? <Sparkles size={12} /> : <UserIcon size={12} />}
                            </div>
                            <div className={`max-w-[80%] text-sm rounded-lg px-3 py-2 ${m.from === "bot" ? "bg-blue-50 text-blue-900" : "bg-gray-100 text-gray-800"}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}

                    {parseMutation.isPending && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 pl-8">
                            <Sparkles size={12} className="animate-pulse" /> Thinking...
                        </div>
                    )}
                </div>

                {/* Dynamic Chat Input */}
                {!review && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <input
                            type="text"
                            className="flex-1 h-10 px-3 text-sm rounded border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            placeholder={pendingSlot ? `Provide ${pendingSlot}...` : "Type in English or Hinglish, or record a voice note..."}
                            value={input}
                            disabled={parseMutation.isPending || voiceRecorderBusy}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            autoFocus
                        />
                        {/* Voice notes only make sense for the free-form first message — slot answers
                            (assignee/department/due date) are single facts faster to type than to
                            record, and there's nowhere to route a "voice" flag for them anyway. */}
                        {!pendingSlot && (
                            <VoiceNoteRecorder
                                disabled={parseMutation.isPending}
                                onBusyChange={setVoiceRecorderBusy}
                                onTranscribed={(transcript) => {
                                    setInitialInputMode("voice");
                                    handleSend(transcript);
                                }}
                            />
                        )}
                        <Button
                            variant="primary"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || parseMutation.isPending || voiceRecorderBusy}
                            className="shrink-0"
                        >
                            <Send size={14} />
                        </Button>
                    </div>
                )}

                {/* Form Review Panel */}
                {review && (
                    <div className="flex flex-col gap-5 pt-2 border-t border-gray-100">
                        <Input
                            id="smart-title"
                            label="Title"
                            value={review.title}
                            onChange={(e) => setReview({ ...review, title: e.target.value })}
                            labelClassName={FIELD_LABEL_CLASS}
                        />
                        <Textarea
                            id="smart-context"
                            label="Context"
                            rows={3}
                            value={review.context}

                            
                            onChange={(e) => setReview({ ...review, context: e.target.value })}
                        />
                        <TaskFormPrioritySelector
                            value={review.priority}
                            onChange={(v) => setReview({ ...review, priority: v })}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input
                                id="smart-due-date"
                                type="date"
                                label="Due Date"
                                icon={Calendar}
                                iconClassName={FIELD_LABEL_ICON_CLASS}
                                labelClassName={FIELD_LABEL_CLASS}
                                value={review.dueDate}
                                onChange={(e) => setReview({ ...review, dueDate: e.target.value })}
                            />
                            <TaskFormDepartmentField
                                value={review.departmentId}
                                onChange={(v) => setReview({ ...review, departmentId: v })}
                                departments={departments}
                                isLoading={isLoadingDepts}
                            />
                        </div>
                        <TaskFormAssigneeField
                            value={review.assigneeId}
                            onChange={(v) => setReview({ ...review, assigneeId: v })}
                            users={assignableUsers}
                            isLoading={isLoadingUsers}
                        />
                        {parsed && parsed.confidence < 0.6 && (
                            <p className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                Low confidence extraction ({Math.round(parsed.confidence * 100)}%) — please review all fields carefully before creating.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};