import {
  DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { useUpdateTaskMutation } from "./hook";
import { STATUS_LABEL, STATUS_CONFIG } from "./taskDisplay";
import { taskAssigneeIds, type CardFieldVisibility } from "./cardFields";
import type { Task } from "../../api/task";

const resolveAssigneeNames = (task: Task, assigneeNames: Map<string, string>) =>
  taskAssigneeIds(task).map((id) => assigneeNames.get(id)).filter((n): n is string => !!n);

// task.userId is whoever raised/created the delegation — assignableUsers (the same map used to
// resolve assignee names) covers them too, since anyone assignable can also raise a delegation.
const resolveRaisedByName = (task: Task, assigneeNames: Map<string, string>) =>
  assigneeNames.get(task.userId);

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

interface TaskBoardProps {
  tasks: Task[];
  assigneeNames: Map<string, string>;
  departmentNames?: Map<string, string>;
  isVerifier?: boolean;
  onOpen: (task: Task) => void;
  onAddTask?: () => void;
  fields: CardFieldVisibility;
}

interface CardProps {
  task: Task;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  assigneeNames?: string[];
  raisedByName?: string;
  departmentName?: string;
  fields: CardFieldVisibility;
}

// Wraps TaskCard so the whole card can be picked up and dropped on another column. dnd-kit only
// treats the gesture as a drag once the pointer has moved past the sensor's activation distance
// (see PointerSensor config below) — anything shorter still reaches TaskCard's own onClick to
// open the detail sheet, so drag and click coexist without extra handling here.
//
// Deliberately spreads only `listeners` (the pointer handlers), not dnd-kit's `attributes` —
// those add their own `role="button" tabIndex={0}`, and since there's no KeyboardSensor wired
// up, that would just stack a second, non-functional keyboard stop on top of TaskCard's own
// role="button". The floating drag visual comes from DragOverlay below, so this node itself
// only needs to fade out while its content is "lifted".
const DraggableCard = ({ task, ...cardProps }: CardProps) => {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={isDragging ? 'opacity-40 cursor-grabbing touch-none' : 'cursor-grab touch-none'}
    >
      <TaskCard task={task} {...cardProps} />
    </div>
  );
};

interface ColumnProps {
  status: Task['status'];
  tasks: Task[];
  assigneeNames: Map<string, string>;
  departmentNames?: Map<string, string>;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  onAddTask?: () => void;
  fields: CardFieldVisibility;
}

const Column = ({ status, tasks, assigneeNames, departmentNames, isVerifier, onOpen, onAddTask, fields }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-1.5 rounded-lg border min-w-0 p-1.5 transition-colors duration-150 ${
        isOver ? 'border-primary-400 bg-primary-50/40' : 'border-border bg-surface-hover/40'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-semibold text-text-secondary truncate">
            {STATUS_LABEL[status]}
          </h3>
          <span className={`flex items-center justify-center min-w-[1.5rem] h-5 px-2 text-xs font-bold rounded-full border ${STATUS_CONFIG[status].badge}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[150px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 px-3 text-center border border-dashed border-border rounded-md bg-surface/40 text-text-light">
            <Sparkles size={14} className="mb-1 text-text-light" />
            <span className="text-[11px] font-medium text-text-light">No delegations</span>
          </div>
        ) : (
          tasks.map(task => (
            <DraggableCard
              key={task.id}
              task={task}
              isVerifier={isVerifier}
              onOpen={onOpen}
              assigneeNames={resolveAssigneeNames(task, assigneeNames)}
              raisedByName={resolveRaisedByName(task, assigneeNames)}
              departmentName={task.departmentId ? departmentNames?.get(task.departmentId) : undefined}
              fields={fields}
            />
          ))
        )}
      </div>

      {/* New tasks always start in "To Do" server-side, so a quick-add only makes sense here —
          it reuses the same handler as the toolbar's "New Task" button. */}
      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium text-text-muted bg-surface/60 hover:bg-surface hover:text-primary-600 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
        >
          <Plus size={14} />
          Add new task
        </button>
      )}
    </div>
  );
};

export const TaskBoard = ({ tasks, assigneeNames, departmentNames, isVerifier = false, onOpen, onAddTask, fields }: TaskBoardProps) => {
  const updateMutation = useUpdateTaskMutation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(tasks.find(t => t.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const newStatus = event.over?.id as Task['status'] | undefined;
    if (!newStatus) return;

    const task = tasks.find(t => t.id === event.active.id);
    if (!task || task.status === newStatus) return;

    // Mirrors task.service.ts's update() guard — "done" only happens through the verification
    // flow (TaskVerifyActions' Approve), not a raw status drop, so block it client-side with a
    // clear reason instead of letting the request round-trip into a 403.
    if (newStatus === 'done' && !isVerifier) {
      toast.error('Only a verifier can mark a task done — send it for review instead.');
      return;
    }

    updateMutation.mutate({ id: task.id, payload: { status: newStatus } });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-start">
        {COLUMNS.map(status => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            assigneeNames={assigneeNames}
            departmentNames={departmentNames}
            isVerifier={isVerifier}
            onOpen={onOpen}
            onAddTask={status === 'todo' ? onAddTask : undefined}
            fields={fields}
          />
        ))}
      </div>

      {/* Renders the dragged card in a top-level portal with its own transform, instead of
          translating the source node in place — keeps it visually above every column
          regardless of stacking context, and gives it a "lifted" tilt/shadow as feedback. */}
      <DragOverlay>
        {activeTask && (
          <div className="w-60 rotate-1 shadow-xl cursor-grabbing">
            <TaskCard
              task={activeTask}
              isVerifier={isVerifier}
              onOpen={onOpen}
              assigneeNames={resolveAssigneeNames(activeTask, assigneeNames)}
              raisedByName={resolveRaisedByName(activeTask, assigneeNames)}
              departmentName={activeTask.departmentId ? departmentNames?.get(activeTask.departmentId) : undefined}
              fields={fields}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
