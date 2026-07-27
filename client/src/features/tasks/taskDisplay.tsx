import React from 'react';
import { CheckCircle2, Clock, CircleDashed, ShieldQuestion } from 'lucide-react';
import type { Task } from '../../api/task';


export const PRIORITY_MAP = {
  low: { 
    label: 'Low', 
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', 
    accent: 'bg-slate-400' 
  },
  medium: { 
    label: 'Medium', 
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', 
    accent: 'bg-amber-500' 
  },
  high: { 
    label: 'High', 
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', 
    accent: 'bg-rose-500' 
  },
} satisfies Record<Task['priority'], { label: string; className: string; accent: string }>;


export const STATUS_ICON = {
  todo: <CircleDashed size={15} className="text-text-muted/70 shrink-0" />,
  in_progress: <Clock size={15} className="text-amber-500 shrink-0" />,
  pending_verification: <ShieldQuestion size={15} className="text-indigo-500 shrink-0" />,
  done: <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />,
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
    badge: 'bg-surface-hover/80 text-text-muted border-border/60',
    indicator: 'bg-text-muted/40',
    columnHeader: 'border-border/50 bg-surface/30',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    indicator: 'bg-amber-500',
    columnHeader: 'border-amber-500/20 bg-amber-500/5',
  },
  pending_verification: {
    label: 'Pending Verification',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    indicator: 'bg-indigo-500',
    columnHeader: 'border-indigo-500/20 bg-indigo-500/5',
  },
  done: {
    label: 'Done',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    indicator: 'bg-emerald-500', 
    columnHeader: 'border-emerald-500/20 bg-emerald-500/5',
  },
} satisfies Record<
  Task['status'],
  { label: string; badge: string; indicator: string; columnHeader: string }
>;


export const NEXT_STATUS: Record<Task['status'], Task['status'] | null> = {
  todo: 'in_progress',
  in_progress: 'pending_verification',
  pending_verification: null,
  done: null,
};