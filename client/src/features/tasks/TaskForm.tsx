import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CheckSquare, 
  Calendar, 
  User, 
  Building2, 
  AlertCircle, 
  FileText, 
  Heading, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';

const UNASSIGNED = '__unassigned__';
const NO_DEPARTMENT = '__none__';

const LABEL_CLASS = 
  'text-[11px] font-mono font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 select-none';

const INPUT_BASE_CLASS = 
  'w-full px-3.5 py-2 text-xs font-mono bg-surface/60 text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all duration-200 placeholder:text-text-muted/50 hover:border-border';

// ── Schema ─────────────────────────────────────────────────────
const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val).toISOString() : undefined)),
  assigneeId: z
    .string()
    .optional()
    .transform((val) => (val !== '' ? val : undefined)),
  departmentId: z
    .string()
    .optional()
    .transform((val) => (val !== '' ? val : undefined)),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
}

const PRIORITIES: { 
  value: TaskFields['priority']; 
  label: string; 
  dotColor: string;
  activeClass: string;
}[] = [
  { 
    value: 'low', 
    label: 'Low', 
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    activeClass: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' 
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    activeClass: 'border-amber-500/60 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/20 shadow-sm' 
  },
  { 
    value: 'high', 
    label: 'High', 
    dotColor: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    activeClass: 'border-rose-500/60 bg-rose-500/10 text-rose-300 ring-2 ring-rose-500/20 shadow-sm' 
  },
];

export const TaskForm = ({ onClose }: TaskFormProps) => {
  const mutation = useCreateTaskMutation();
  const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
  const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      assigneeId: '',
      departmentId: '',
    },
  });

  const priority     = watch('priority');
  const assigneeId   = watch('assigneeId');
  const departmentId = watch('departmentId');

  const onSubmit = (data: TaskFields) => {
    mutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl border-border/50 bg-surface/90 backdrop-blur-xl shadow-2xl p-0 rounded-2xl overflow-hidden font-mono transition-all">
        
        {/* Ambient Top Glow Banner */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 opacity-90" />

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-border/80">
          
          {/* Header */}
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/25 shadow-inner">
                  <CheckSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold tracking-tight text-text flex items-center gap-2">
                    Create New Task
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                      Draft
                    </span>
                  </DialogTitle>
                  <p className="text-xs text-text-muted mt-0.5">
                    Define objectives, set priorities, and assign responsible members.
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
            {/* Title Input */}
            <div className="space-y-1.5">
              <label htmlFor="title" className={LABEL_CLASS}>
                <Heading className="w-3.5 h-3.5 text-primary-400" /> Task Title <span className="text-rose-400">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. Redesign the landing page hero section"
                error={errors.title?.message}
                className="font-mono text-xs h-10 bg-surface/60 border-border/70 focus:border-primary-500/60 rounded-lg shadow-sm"
                {...register('title')}
                autoFocus
              />
            </div>

            {/* Description Area */}
            <div className="space-y-1.5">
              <label htmlFor="description" className={LABEL_CLASS}>
                <FileText className="w-3.5 h-3.5 text-text-muted" /> Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Provide task context, constraints, acceptance criteria, or relevant links…"
                className={`${INPUT_BASE_CLASS} resize-none leading-relaxed`}
                {...register('description')}
              />
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className={LABEL_CLASS}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2.5 p-1 bg-surface-dark/40 rounded-xl border border-border/40">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue('priority', p.value)}
                      className={`relative flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? p.activeClass
                          : 'border-transparent bg-transparent text-text-muted hover:bg-surface/80 hover:text-text'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full transition-transform ${p.dotColor} ${isSelected ? 'scale-110' : 'opacity-60'}`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date & Assignment Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Due Date */}
              <div className="space-y-1.5">
                <label htmlFor="dueDate" className={LABEL_CLASS}>
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Due Date
                </label>
                <div className="relative">
                  <input
                    id="dueDate"
                    type="date"
                    className={`${INPUT_BASE_CLASS} h-10 cursor-pointer text-text-secondary`}
                    {...register('dueDate')}
                  />
                </div>
                {errors.dueDate?.message && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.dueDate.message}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Department
                </label>
                <Select
                  value={departmentId || NO_DEPARTMENT}
                  onValueChange={(v) => setValue('departmentId', v === NO_DEPARTMENT ? '' : v)}
                  disabled={isLoadingDepts}
                >
                  <SelectTrigger className="h-10 text-xs font-mono bg-surface/60 border-border/70 rounded-lg hover:border-border transition-all">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
                    <SelectItem value={NO_DEPARTMENT} className="font-mono text-xs text-text-muted">
                      No Department
                    </SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="font-mono text-xs">
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-text-muted" />
                          {d.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee Field (Full width row) */}
            <div className="space-y-1.5">
              <label className={LABEL_CLASS}>
                <User className="w-3.5 h-3.5 text-sky-400" /> Assignee
              </label>
              <Select
                value={assigneeId || UNASSIGNED}
                onValueChange={(v) => setValue('assigneeId', v === UNASSIGNED ? '' : v)}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="h-10 text-xs font-mono bg-surface/60 border-border/70 rounded-lg hover:border-border transition-all">
                  <SelectValue placeholder="Assign team member" />
                </SelectTrigger>
                <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
                  <SelectItem value={UNASSIGNED} className="font-mono text-xs text-text-muted">
                    Unassigned
                  </SelectItem>
                  {assignableUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center justify-center text-[10px] font-bold">
                          {u.firstName?.[0]}
                        </div>
                        <span className="font-medium text-text">{u.firstName} {u.lastName ?? ''}</span>
                        <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface border border-border/50">
                          {u.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Callout Banner */}
            {mutation.isError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 font-mono flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <p className="leading-tight">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'Failed to create task. Please try again.'}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <DialogFooter className="pt-4 border-t border-border/40 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={mutation.isPending}
                className="h-9 px-4 text-xs font-mono border-border/60 hover:bg-surface-hover hover:text-text rounded-lg transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={mutation.isPending || isSubmitting}
                className="h-9 px-4 text-xs font-mono bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Create Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>

          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};