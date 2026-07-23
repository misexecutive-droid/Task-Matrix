import { 
  Clock, 
  ChevronRight, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Building2, 
  FileText, 
  Layers, 
  Tag, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useTaskQuery, useUpdateTaskMutation } from './hook';
import { TaskChecklistPanel } from './TaskChecklistPanel';
import { Button, Skeleton } from '../../components';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { useAuth } from '../../context/AuthContext';
import { PRIORITY_MAP, STATUS_LABEL, NEXT_STATUS } from './TaskList';
import type { Task } from '../../api/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task: initialTask, onClose }: TaskDetailProps) => {
  const { data: fresh, isPending } = useTaskQuery(initialTask.id);
  const task = fresh ?? initialTask;
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const updateMutation = useUpdateTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const next = NEXT_STATUS[task.status];

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done';

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="flex flex-col h-full sm:max-w-lg p-0 overflow-hidden border-l border-border/50 bg-surface/90 backdrop-blur-xl shadow-2xl font-mono text-text transition-all">

        {/* Ambient Top Status Accent Bar */}
        <div className={`h-1.5 shrink-0 transition-all duration-300 ${
          task.status === 'done' 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500' :
          task.status === 'in_progress' 
            ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500' :
            'bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500'
        }`} />

        {/* Header Section */}
        <SheetHeader className="p-6 pb-4 border-b border-border/40 bg-surface/40 space-y-3">
          
          {/* Metadata Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {priority && (
              <span
                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-md ${priority.className}`}
              >
                <span className="size-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                {priority.label}
              </span>
            )}
            
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-surface/80 border border-border/70 text-text-secondary flex items-center gap-1">
              <Tag size={10} className="text-text-muted" />
              {STATUS_LABEL[task.status]}
            </span>

            {isOverdue && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1 animate-pulse">
                <AlertCircle size={10} /> Overdue
              </span>
            )}
          </div>

          {/* Task Title */}
          <SheetTitle className="text-lg font-bold tracking-tight text-text leading-snug">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-border/80">
          {isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl bg-surface-hover/50" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-surface-hover/50" />
              <Skeleton className="h-4 w-1/2 rounded-md bg-surface-hover/50" />
              <Skeleton className="h-32 w-full rounded-xl bg-surface-hover/50 mt-4" />
            </div>
          ) : (
            <>
              {/* Primary Grid Information Card */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-surface/50 border border-border/50 rounded-xl text-xs backdrop-blur-sm shadow-inner">
                
                {/* Creation Date */}
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5 select-none">
                    <Calendar size={12} className="text-primary-400" /> Created
                  </span>
                  <span className="text-text font-medium">
                    {new Date(task.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5 select-none">
                    <Clock size={12} className={isOverdue ? 'text-rose-400' : 'text-indigo-400'} /> Due Date
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      isOverdue ? 'text-rose-400' : task.dueDate ? 'text-text' : 'text-text-muted italic font-normal'
                    }`}
                  >
                    {task.dueDate ? (
                      <>
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {isOverdue && <AlertCircle size={12} className="text-rose-400 shrink-0" />}
                      </>
                    ) : (
                      'No deadline'
                    )}
                  </span>
                </div>

                {/* Assignee (if available) */}
                {(task as any).assignee && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-border/30 col-span-1">
                    <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5 select-none">
                      <User size={12} className="text-sky-400" /> Assignee
                    </span>
                    <span className="text-text font-medium truncate">
                      {(task as any).assignee.firstName} {(task as any).assignee.lastName ?? ''}
                    </span>
                  </div>
                )}

                {/* Department (if available) */}
                {(task as any).department && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-border/30 col-span-1">
                    <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5 select-none">
                      <Building2 size={12} className="text-emerald-400" /> Department
                    </span>
                    <span className="text-text font-medium truncate">
                      {(task as any).department.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <FileText size={13} className="text-text-secondary" /> Description
                </h3>
                {task.description ? (
                  <div className="p-4 bg-surface/60 rounded-xl border border-border/60 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap shadow-2xs">
                    {task.description}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/50 text-xs text-text-muted italic text-center">
                    No description provided for this task.
                  </div>
                )}
              </div>

              {/* Checklists Panel */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider select-none mb-1">
                  <Layers size={13} className="text-primary-400" /> Subtasks & Action Items
                </div>
                <TaskChecklistPanel
                  taskId={task.id}
                  checklists={task.checklists ?? []}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-border/40 bg-surface/80 backdrop-blur-md flex-row items-center justify-between gap-3">
          <div>
            {!next && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg shadow-2xs">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Task Completed</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {next && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9 font-mono border-border/70 hover:bg-surface-hover transition-all group"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({ id: task.id, payload: { status: next } })
                }
              >
                {updateMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin text-primary-400" />
                ) : (
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                )}
                <span>Advance to {STATUS_LABEL[next]}</span>
              </Button>
            )}

            <Button 
              variant="primary" 
              size="sm" 
              onClick={onClose}
              className="h-9 px-4 text-xs font-mono bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 rounded-lg active:scale-[0.98] transition-all"
            >
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};