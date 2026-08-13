import React from 'react';
import { CheckCircle2, Clock, CircleDashed, ShieldQuestion } from 'lucide-react';
import type { Task } from '../../api/task';

export const PRIORITY_MAP = {
  low: {
    label: 'Low',
    className: 'bg-surface-hover text-text-muted transition-colors duration-200',
    accent: 'bg-text-light',
  },
  medium: {
    label: 'Medium',
    className: 'bg-warning/10 text-warning transition-colors duration-200',
    accent: 'bg-warning',
  },
  high: {
    label: 'High',
    className: 'bg-danger/10 text-danger transition-colors duration-200',
    accent: 'bg-danger',
  },
} satisfies Record<Task['priority'], { label: string; className: string; accent: string }>;


export const STATUS_ICON = {
  todo: <CircleDashed size={16} className="text-status-todo shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  in_progress: <Clock size={16} className="text-status-progress shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  pending_verification: <ShieldQuestion size={16} className="text-status-verify shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  done: <CheckCircle2 size={16} className="text-status-done shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
} satisfies Record<Task['status'], React.ReactNode>;


export const STATUS_LABEL = {
  todo: 'To Do',
  in_progress: 'In Progress',
  pending_verification: 'Pending Verification',
  done: 'Done',
} satisfies Record<Task['status'], string>;


export const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    badge: 'bg-status-todo/10 text-status-todo border-status-todo/20 transition-all duration-200 ease-in-out',
    indicator: 'bg-status-todo transition-colors duration-200',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-status-progress/10 text-status-progress border-status-progress/20 transition-all duration-200 ease-in-out',
    indicator: 'bg-status-progress transition-colors duration-200',
  },
  pending_verification: {
    label: 'Pending Verification',
    badge: 'bg-status-verify/10 text-status-verify border-status-verify/20 transition-all duration-200 ease-in-out',
    indicator: 'bg-status-verify transition-colors duration-200',
  },
  done: {
    label: 'Done',
    badge: 'bg-status-done/10 text-status-done border-status-done/20 transition-all duration-200 ease-in-out',
    indicator: 'bg-status-done transition-colors duration-200',
  },
} satisfies Record<
  Task['status'],
  { label: string; badge: string; indicator: string }
>;


export const NEXT_STATUS: Record<Task['status'], Task['status'] | null> = {
  todo: 'in_progress',
  in_progress: 'pending_verification',
  pending_verification: null,
  done: null,
};

// Self-service "undo" — deliberately only in_progress -> todo. Reverting out of
// pending_verification or done has to go through TaskVerifyActions (REJECT), not a raw status
// edit, since that path also records a verification note and notifies the assignee.
export const PREV_STATUS: Record<Task['status'], Task['status'] | null> = {
  todo: null,
  in_progress: 'todo',
  pending_verification: null,
  done: null,
};