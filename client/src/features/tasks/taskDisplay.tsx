import React from 'react';
import { CheckCircle2, Clock, CircleDashed, ShieldQuestion } from 'lucide-react';
import type { Task } from '../../api/task';

export const PRIORITY_MAP = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-600 border-gray-200 shadow-sm transition-all duration-200 ease-in-out dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    accent: 'bg-gray-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm transition-all duration-200 ease-in-out dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/30',
    accent: 'bg-amber-500',
  },
  high: {
    label: 'High',
    className: 'bg-red-50 text-red-700 border-red-200 shadow-sm transition-all duration-200 ease-in-out dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30',
    accent: 'bg-red-600',
  },
} satisfies Record<Task['priority'], { label: string; className: string; accent: string }>;


export const STATUS_ICON = {
  todo: <CircleDashed size={16} className="text-gray-400 dark:text-gray-500 shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  in_progress: <Clock size={16} className="text-amber-500 dark:text-amber-400 shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  pending_verification: <ShieldQuestion size={16} className="text-indigo-500 dark:text-indigo-400 shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
  done: <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0 transition-colors duration-200" strokeWidth={2.5} />,
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
    badge: 'bg-gray-50 text-gray-700 border-gray-200 transition-all duration-200 ease-in-out dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    indicator: 'bg-gray-400 dark:bg-gray-500 transition-colors duration-200',
    columnHeader: 'border-t-slate-400 bg-white dark:bg-slate-900 transition-colors duration-200',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 transition-all duration-200 ease-in-out dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/30',
    indicator: 'bg-amber-500 transition-colors duration-200',
    columnHeader: 'border-t-amber-500 bg-white dark:bg-slate-900 transition-colors duration-200',
  },
  pending_verification: {
    label: 'Pending Verification',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 transition-all duration-200 ease-in-out dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500/30',
    indicator: 'bg-indigo-500 transition-colors duration-200',
    columnHeader: 'border-t-indigo-500 bg-white dark:bg-slate-900 transition-colors duration-200',
  },
  done: {
    label: 'Done',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 transition-all duration-200 ease-in-out dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/30',
    indicator: 'bg-emerald-500 transition-colors duration-200', 
    columnHeader: 'border-t-emerald-500 bg-white dark:bg-slate-900 transition-colors duration-200',
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