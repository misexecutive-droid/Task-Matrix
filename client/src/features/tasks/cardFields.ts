import { useEffect, useState } from 'react';
import {
  SquareStack,
  Users,
  CalendarClock,
  ListChecks,
  Flag,
  Tag,
  Bug,
  UserCheck,
  Building2,
  CalendarPlus,
  History,
  type LucideIcon,
} from 'lucide-react';
import type { Task } from '../../api/task';
export type CardFieldKey =
  | 'status'
  | 'assignee'
  | 'dueDate'
  | 'subtasks'
  | 'priority'
  | 'category'
  | 'department'
  | 'created'
  | 'updated';

export const CARD_FIELD_CONFIG: { key: CardFieldKey; label: string; icon: LucideIcon }[] = [
  { key: 'status', label: 'Status', icon: SquareStack },
  { key: 'assignee', label: 'Assignee', icon: Users },
  { key: 'dueDate', label: 'Due date', icon: CalendarClock },
  { key: 'subtasks', label: 'Subtasks', icon: ListChecks },
  { key: 'priority', label: 'Priority', icon: Flag },
  { key: 'category', label: 'Category', icon: Tag },
  { key: 'department', label: 'Department', icon: Building2 },
  { key: 'created', label: 'Created', icon: CalendarPlus },
  { key: 'updated', label: 'Updated', icon: History },
];

export type CardFieldVisibility = Record<CardFieldKey, boolean>;

const DEFAULT_VISIBILITY: CardFieldVisibility = {
  status: true,
  assignee: true,
  dueDate: true,
  subtasks: true,
  priority: true,
  category: true,
  department: true,
  created: false,
  updated: false,
};

const STORAGE_KEY = 'taskmatrix:card-fields';


export const useCardFieldVisibility = () => {
  const [visibility, setVisibility] = useState<CardFieldVisibility>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_VISIBILITY, ...JSON.parse(raw) } : DEFAULT_VISIBILITY;
    } catch {
      return DEFAULT_VISIBILITY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
    } catch {
      // localStorage unavailable (private mode, quota) — preference just won't persist.
    }
  }, [visibility]);

  const toggle = (key: CardFieldKey) => setVisibility(v => ({ ...v, [key]: !v[key] }));
  return { visibility, toggle };
};

export const CATEGORY_CONFIG: Record<Task['category'], { label: string; icon: LucideIcon; className: string }> = {
  issue: { label: 'Issue', icon: Bug, className: 'bg-danger/10 text-danger' },
  delegation: { label: 'Delegation', icon: UserCheck, className: 'bg-info/10 text-info' },
};

export const subtaskProgress = (task: { checklists?: { items: { isDone: boolean }[] }[] }) => {
  const items = (task.checklists ?? []).flatMap(c => c.items);
  if (items.length === 0) return null;
  return { done: items.filter(i => i.isDone).length, total: items.length };
};

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Primary assignee + extras as one flat list — the UI treats "assignees" as a single unified
// concept even though the backend stores them as assigneeId (primary) + additionalAssigneeIds
// (extras) to keep the AI/WhatsApp parsing and reporting pipelines (all single-assignee) unchanged.
export const taskAssigneeIds = (task: Pick<Task, 'assigneeId' | 'additionalAssigneeIds'>): string[] =>
  [task.assigneeId, ...(task.additionalAssigneeIds ?? [])].filter((id): id is string => !!id);
