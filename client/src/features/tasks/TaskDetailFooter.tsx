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
    <SheetFooter className="p-0 border-t border-gray-200 bg-white block">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-3">
        <div>
          {task.status === 'done' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Task Completed</span>
            </div>
          )}
          {task.status === 'pending_verification' && !isVerifier && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
              <ShieldQuestion size={16} className="text-indigo-600 shrink-0" />
              <span>Awaiting verification</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {nextStatus && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all group shadow-sm"
              disabled={isAdvancing}
              onClick={onAdvance}
            >
              {isAdvancing ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
              ) : (
                <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
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