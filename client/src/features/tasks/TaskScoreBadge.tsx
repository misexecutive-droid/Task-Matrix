import { TASK_SCORE, taskScorePercent } from './taskDisplay';
import type { Task } from '../../api/task';

// Same three-tier coloring language as PRIORITY_MAP/STATUS_CONFIG (success/warning/muted) rather
// than a new palette, so this reads as "part of the same system" wherever it shows up.
const scoreBadgeClass = (status: Task['status']) => {
  const score = TASK_SCORE[status];
  if (score >= 1) return 'bg-success/10 text-success';
  if (score > 0) return 'bg-warning/10 text-warning';
  return 'bg-surface-hover text-text-muted';
};

interface TaskScoreBadgeProps {
  status: Task['status'];
  /** 'sm' matches TaskCard's compact meta pills; 'md' matches TaskRow/TaskTable's larger ones. */
  variant?: 'sm' | 'md';
}

const VARIANT_CLASS = {
  sm: 'gap-1 px-1.5 py-0.5 rounded text-[10px]',
  md: 'gap-1.5 px-2 py-0.5 rounded-full text-[11px]',
} as const;

export const TaskScoreBadge = ({ status, variant = 'md' }: TaskScoreBadgeProps) => (
  <span className={`inline-flex items-center font-semibold ${VARIANT_CLASS[variant]} ${scoreBadgeClass(status)}`}>
    Mark {taskScorePercent(status)}%
  </span>
);
