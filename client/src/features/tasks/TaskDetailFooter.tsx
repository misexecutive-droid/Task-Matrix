import { Loader2, ChevronRight, CheckCircle2, ShieldQuestion } from 'lucide-react';
import { SheetFooter } from '@/components/ui/sheet';
import { Button } from '../../components';
import { STATUS_LABEL } from './taskDisplay';
import type { Task } from '../../api/task';

interface TaskDetailFooterProps {
  task:            Task;
  isVerifier:      boolean;
  nextStatus?:     Task['status'] | null;
  isAdvancing:     boolean;
  onAdvance:       () => void;
  onClose:         () => void;
}

/** Status callouts (completed / awaiting verification) plus the advance-status and Done actions. */
export const TaskDetailFooter = ({
  task, isVerifier, nextStatus, isAdvancing, onAdvance, onClose,
}: TaskDetailFooterProps) => {
  return (
    <SheetFooter className="p-0 border-t border-border bg-surface block">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-3">
        <div>
          {task.status === 'done' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg shadow-sm">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <span>Task Completed</span>
            </div>
          )}
          {task.status === 'pending_verification' && !isVerifier && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-info px-3 py-1.5 bg-info/10 border border-info/20 rounded-lg shadow-sm">
              <ShieldQuestion size={16} className="text-info shrink-0" />
              <span>Awaiting verification</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {nextStatus && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 border-border-hover text-text-secondary hover:bg-surface-hover transition-all group shadow-sm"
              disabled={isAdvancing}
              onClick={onAdvance}
            >
              {isAdvancing ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
              ) : (
                <ChevronRight size={14} className="text-text-light group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              )}
              <span>Advance to {STATUS_LABEL[nextStatus]}</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="h-9 px-6 text-xs transition-all shadow-sm"
          >
            Done
          </Button>
        </div>
      </div>
    </SheetFooter>
  );
};