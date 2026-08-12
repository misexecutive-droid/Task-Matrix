import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { Sparkles } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { useUpdateTaskMutation } from "./hook";
import { STATUS_LABEL, STATUS_CONFIG } from "./taskDisplay";
import type { Task } from "../../api/task";

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

interface TaskBoardProps {
  tasks: Task[];
  assigneeNames: Map<string, string>;
  departmentNames?: Map<string, string>;
  isAdmin: boolean;
  isVerifier?: boolean;
  onOpen: (task: Task) => void;
}

interface CardProps {
  task: Task;
  isAdmin: boolean;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  assigneeName?: string;
  departmentName?: string;
}

// Wraps TaskCard so the whole card can be picked up and dropped on another column. dnd-kit only
// treats the gesture as a drag once the pointer has moved past the sensor's activation distance
// (see PointerSensor config below) — anything shorter still reaches TaskCard's own onClick to
// open the detail sheet, so drag and click coexist without extra handling here.
const DraggableCard = ({ task, ...cardProps }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50 z-10 cursor-grabbing touch-none' : 'cursor-grab touch-none'}
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
  isAdmin: boolean;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
}

const Column = ({ status, tasks, assigneeNames, departmentNames, isAdmin, isVerifier, onOpen }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border min-w-0 p-1.5 transition-colors duration-150 ${
        isOver ? 'border-blue-400 bg-blue-50/40' : 'border-border bg-surface-hover/40'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`size-2 rounded-full shrink-0 ${STATUS_CONFIG[status].indicator}`} />
          <h3 className="text-xs font-semibold text-text-secondary truncate">
            {STATUS_LABEL[status]}
          </h3>
          <span className="px-1.5 py-0.2 text-[11px] font-semibold text-text-muted bg-surface-active/60 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[150px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 px-3 text-center border border-dashed border-border rounded-md bg-surface/40 text-text-light">
            <Sparkles size={14} className="mb-1 text-text-light" />
            <span className="text-[11px] font-medium text-text-light">No tasks</span>
          </div>
        ) : (
          tasks.map(task => (
            <DraggableCard
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              isVerifier={isVerifier}
              onOpen={onOpen}
              assigneeName={task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined}
              departmentName={task.departmentId ? departmentNames?.get(task.departmentId) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const TaskBoard = ({ tasks, assigneeNames, departmentNames, isAdmin, isVerifier = false, onOpen }: TaskBoardProps) => {
  const updateMutation = useUpdateTaskMutation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-start">
        {COLUMNS.map(status => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            assigneeNames={assigneeNames}
            departmentNames={departmentNames}
            isAdmin={isAdmin}
            isVerifier={isVerifier}
            onOpen={onOpen}
          />
        ))}
      </div>
    </DndContext>
  );
};
