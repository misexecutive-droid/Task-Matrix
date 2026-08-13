import {
  Loader2,
  Trash2,
  User,
  CheckCircle2,
  ShieldQuestion,
  Clock,
  SquarePen,
  ListChecks,
  CalendarPlus,
  History,
} from "lucide-react";
import { useDeleteTaskMutation } from "./hook";
import { TaskVerifyActions } from "./TaskVerifyActions";
import { PRIORITY_MAP } from "./taskDisplay";
import { departmentTagClass } from "./departmentTagColors";
import { TaskSourceBadge } from "./TaskSourceBadge";
import { coverPhotoFor } from "./taskAttachmentDisplay";
import { UPLOADS_BASE } from "../../lib/uploadsBase";
import { avatarColorClass } from "./avatarColors";
import { getInitials } from "../../lib/getInitials";
import { CATEGORY_CONFIG, subtaskProgress, formatShortDate, type CardFieldVisibility } from "./cardFields";
import type { Task } from "../../api/task";

interface TaskCardProps {
  task: Task;
  assigneeNames?: string[];
  departmentName?: string;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  index?: number;
  fields: CardFieldVisibility;
}

const MAX_VISIBLE_AVATARS = 3;

const daysLeftLabel = (dueDate: string) => {
  const diffMs = new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(diffMs / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} left`;
};

export const TaskCard = ({ task, assigneeNames = [], departmentName, isVerifier, onOpen, fields }: TaskCardProps) => {
  const deleteMutation = useDeleteTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const coverPhoto = coverPhotoFor(task.attachments);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const subtasks = subtaskProgress(task);

  const showDoneBadge = fields.status && task.status === 'done';
  const showReviewBadge = fields.status && task.status === 'pending_verification' && !isVerifier;
  const showVerifyActions = task.status === 'pending_verification' && isVerifier;
  const showDuePill = fields.dueDate && task.dueDate && task.status !== 'done' && task.status !== 'pending_verification';

  return (
    <div
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      role="button"
      tabIndex={0}
      className="group relative flex flex-col gap-2.5 p-3 rounded-xl bg-surface shadow-xs hover:shadow-md transition-shadow duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-text truncate leading-snug">
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <TaskSourceBadge aiMeta={task.aiMeta} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(task);
            }}
            aria-label="Open task"
            title="Open task"
            className="flex items-center justify-center size-7 rounded-md text-text-light bg-surface-hover hover:text-primary-600 hover:bg-primary-500/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          >
            <SquarePen size={15} strokeWidth={2.5} />
          </button>
          {isVerifier && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(task.id);
              }}
              disabled={deleteMutation.isPending}
              aria-label="Delete task"
              title="Delete task"
              className="flex items-center justify-center size-7 rounded-md text-text-light hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={15} strokeWidth={2.5} className="animate-spin text-danger" />
              ) : (
                <Trash2 size={15} strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>

      {coverPhoto && (
        <img
          src={`${UPLOADS_BASE}${coverPhoto.url}`}
          alt=""
          className="w-full aspect-video rounded-lg object-cover"
        />
      )}

      {task.description && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {fields.department && departmentName && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${departmentTagClass(departmentName)}`}>
            {departmentName}
          </span>
        )}

        {fields.priority && priority && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${priority.className}`}>
            <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
            {priority.label}
          </span>
        )}

        {fields.category && (() => {
          const cat = CATEGORY_CONFIG[task.category];
          return (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cat.className}`}>
              <cat.icon size={12} strokeWidth={2.5} />
              {cat.label}
            </span>
          );
        })()}

        {fields.subtasks && subtasks && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-hover text-text-secondary">
            <ListChecks size={12} strokeWidth={2.5} />
            {subtasks.done}/{subtasks.total}
          </span>
        )}

        {fields.created && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-text-light">
            <CalendarPlus size={12} strokeWidth={2.5} />
            {formatShortDate(task.createdAt)}
          </span>
        )}

        {fields.updated && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-text-light">
            <History size={12} strokeWidth={2.5} />
            {formatShortDate(task.updatedAt)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        {fields.assignee ? (
          assigneeNames.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {assigneeNames.slice(0, MAX_VISIBLE_AVATARS).map((name, i) => (
                <div
                  key={name + i}
                  className={`flex items-center justify-center size-6 rounded-full text-white text-[10px] font-bold ring-2 ring-surface shrink-0 ${avatarColorClass(name)}`}
                  title={`Assigned to ${name}`}
                >
                  {getInitials(name)}
                </div>
              ))}
              {assigneeNames.length > MAX_VISIBLE_AVATARS && (
                <div
                  className="flex items-center justify-center size-6 rounded-full bg-surface-hover text-text-secondary text-[10px] font-bold ring-2 ring-surface shrink-0"
                  title={assigneeNames.slice(MAX_VISIBLE_AVATARS).join(', ')}
                >
                  +{assigneeNames.length - MAX_VISIBLE_AVATARS}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center size-6 rounded-full bg-surface-hover text-text-light ring-2 ring-surface shrink-0"
              title="Unassigned"
            >
              <User size={13} strokeWidth={2.5} />
            </div>
          )
        ) : (
          <span />
        )}

        {showVerifyActions ? (
          <TaskVerifyActions task={task} compact />
        ) : showDoneBadge ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success">
            <CheckCircle2 size={15} strokeWidth={2.5} />
            Done
          </span>
        ) : showReviewBadge ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning/10 text-warning">
            <ShieldQuestion size={15} strokeWidth={2.5} />
            In review
          </span>
        ) : showDuePill ? (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              isOverdue ? 'bg-danger/10 text-danger' : 'bg-surface-hover text-text-secondary'
            }`}
          >
            <Clock size={15} strokeWidth={2.5} />
            {daysLeftLabel(task.dueDate!)}
          </span>
        ) : null}
      </div>
    </div>
  );
};
