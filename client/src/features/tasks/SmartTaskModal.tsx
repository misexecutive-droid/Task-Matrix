import { useState } from "react";
import { useAssignableUsersQuery, useCreateSmartTaskMutation, useParseSmartTaskMutation } from "./hook";
import { useDepartmentsQuery } from "../tickets/hook";
import { toast } from "sonner";
import { Calendar, Sparkles, Wand2Icon } from "lucide-react";
import { Button, Input, Modal, Textarea } from "@/components";
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from "./taskFormFieldStyles";
import { TaskFormPrioritySelector } from "./TaskFormPrioritySelector";
import { TaskFormDepartmentField } from "./TaskFormDepartmentField";
import { TaskFormAssigneeField } from "./TaskFormAssigneeField";
import type { SmartTaskParseResult } from "@/api/task";
import type { Department } from "@/api/departments";

interface SmartTaskModalProps {
    onClose: () => void;
}

type ReviewState = {
    title: string;
    context: string;
    category: "issue" | "delegated_task";
    priority: "low" | "medium" | "high";
    dueDate: string
    assigneeId: string;
    departmentId: string;
}

const topReview = (result: SmartTaskParseResult, departments?: Department[]): ReviewState => ({
    title: result.title,
    context: result.context,
    category: result.category,
    priority: result.priority,
    dueDate: result.dueDate ? result.dueDate.slice(0, 10) : "",
    assigneeId: result.assignee?.id ?? "",
    departmentId: departments?.find(d => d.name.toLowerCase() === result.departmentRaw?.toLowerCase())?.id ?? "",

});

export const SmartTaskModal = ({ onClose }: SmartTaskModalProps) => {
    const [rawText, setRawText] = useState("");
    const [parsed, setParsed] = useState<SmartTaskParseResult | null>(null);
    const [review, setReveiw] = useState<ReviewState | null>(null);

    const parseMutation = useParseSmartTaskMutation();
    const createMutation = useCreateSmartTaskMutation();
    const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
    const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery()

    const handleParse = () => {
        if (!rawText.trim()) return;
        parseMutation.mutate(rawText, {
            onSuccess: (result) => {
                setParsed(result);
                setReveiw(topReview(result, departments))
            },
            onError: () => toast.error("Could not understand that input -- try rephrasing.")
        });
    };


    const handleCreate = () => {
        if (!review || !parsed) return;

        createMutation.mutate(
            {
                title: review?.title,
                context: review?.context || undefined,
                category: review?.category,
                priority: review?.priority,
                dueDate: review?.dueDate ? new Date(review.dueDate).toISOString() : parsed.dueDate,
                assigneeId: review?.assigneeId || undefined,
                departmentId: review?.departmentId || undefined,
                assigneeRaw: parsed.assigneeRaw || undefined,
                departmentRaw: parsed.departmentRaw || undefined,
                confidence: parsed.confidence,
                rawInput: parsed.rawInput,
                inputMode: "text",
                wonBy: parsed.wonBy,
                channel : "web",
            },

            { onSuccess: onClose },
        );
    }

    return (
        <Modal
            open
            onClose={onClose}
            size="xl"
            contentClassName="accent-blue"
            icon={<Sparkles className="w-5 h-5 text-blue-600" />}
            title="Smart Add"
            description={parsed ? "Review what the AI understood, then confirm" : "Describe the task in plain language - the AI will fill in the rest."}

            footer={
                !parsed ? (
                    <Button variant="primary" onClick={handleParse} isLoading={parseMutation.isPending} disabled={!rawText.trim()} className="gap-2">
                        <Wand2Icon size={15} /> Parse with AI
                    </Button>
                ) : (
                    <>

                        <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>
                            Create Task
                        </Button>

                    </>
                )
            }
        >
            {
                !parsed ? (
                    <Textarea
                        id="smart-task-input"
                        label="What needs to happen?"
                        placeholder='e.g. "Ask Harsh to fix the dashboard charts by tommorow"'
                        rows={4}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        autoFocus
                    />
                ) :
                    review && (
                        <>
                            <div className="flex flex-col gap-5">
                                <Input
                                    id="smart-title"
                                    label="Title"
                                    value={review.title}
                                    onChange={(e) => setReveiw({ ...review, title: e.target.value })}
                                    labelClassName={FIELD_LABEL_CLASS}

                                />

                                <Textarea
                                    id="smart-context"
                                    label="Context"
                                    rows={3}
                                    value={review.context}
                                    onChange={(e) => setReveiw({ ...review, context: e.target.value })}
                                />

                                <TaskFormPrioritySelector value={review.priority} onChange={(v) => setReveiw({ ...review, priority: v })} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Input
                                        id="smart-due-date"
                                        label="Due Date"
                                        icon={Calendar}
                                        iconClassName={FIELD_LABEL_ICON_CLASS}
                                        labelClassName={FIELD_LABEL_CLASS}
                                        value={review.dueDate}
                                        onChange={(e) => setReveiw({ ...review, dueDate: e.target.value })}
                                    />

                                    <TaskFormDepartmentField
                                        value={review.departmentId}
                                        onChange={(v) => setReveiw({ ...review, departmentId: v })}
                                        departments={departments}
                                        isLoading={isLoadingDepts}
                                    />


                                </div>

                                <TaskFormAssigneeField
                                    value={review.assigneeId}
                                    onChange={(v) => setReveiw({ ...review, assigneeId: v })}
                                    users={assignableUsers}
                                    isLoading={isLoadingUsers}
                                />

                                {
                                    parsed.confidence < 0.6 && (
                                        <>
                                            <p className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                                Low confidence extraction ({Math.round(parsed.confidence * 100)}%) - double-check these fields before creating.

                                            </p>

                                        </>
                                    )}

                            </div>



                        </>
                    )
            }



        </Modal>
    )
}

