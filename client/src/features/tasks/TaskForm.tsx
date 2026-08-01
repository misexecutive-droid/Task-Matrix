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
import { Button, Input, Textarea, Modal } from '../../components';
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
  'text-xs font-display font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 select-none';

const taskSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required'),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'medium', 'high']),
  dueDate:      z.string().optional().or(z.literal('')),
  assigneeId:   z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
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
    mutation.mutate(
      {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        dueDate:      data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assigneeId:   data.assigneeId !== '' ? data.assigneeId : undefined,
        departmentId: data.departmentId !== '' ? data.departmentId : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        disabled={mutation.isPending}
        className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display border-border/60 hover:bg-surface-hover hover:text-text rounded-lg transition-all"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="task-form"
        variant="primary"
        size="sm"
        isLoading={mutation.isPending || isSubmitting}
        className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
      >
        <span>Create Task</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      icon={<CheckSquare className="w-5 h-5" />}
      title={
        <span className="flex items-center gap-2 truncate">
          Create New Task
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 shrink-0">
            Draft
          </span>
        </span>
      }
      description="Define objectives, set priorities, and assign responsible members."
      footer={footer}
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-6" noValidate>
        {/* Title Input */}
        <Input
          id="title"
          label={<>Task Title <span className="text-danger">*</span></>}
          icon={Heading}
          iconClassName="text-primary-400"
          placeholder="e.g. Redesign the landing page hero section"
          error={errors.title?.message}
          {...register('title')}
          autoFocus
        />

        {/* Description Area */}
        <Textarea
          id="description"
          label="Description"
          icon={FileText}
          rows={3}
          placeholder="Provide task context, constraints, acceptance criteria, or relevant links…"
          {...register('description')}
        />

        {/* Priority Selector */}
        <div className="space-y-2">
          <label className={LABEL_CLASS}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 p-1 sm:p-1.5 bg-surface-dark/40 rounded-xl border border-border/40">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue('priority', p.value)}
                  className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-display font-medium rounded-lg border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? p.activeClass
                      : 'border-transparent bg-transparent text-text-muted hover:bg-surface/80 hover:text-text'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-transform shrink-0 ${p.dotColor} ${isSelected ? 'scale-110' : 'opacity-60'}`} />
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date & Assignment Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pt-1">
          {/* Due Date */}
          <Input
            id="dueDate"
            type="date"
            label="Due Date"
            icon={Calendar}
            iconClassName="text-indigo-400"
            className="cursor-pointer text-text-secondary"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          {/* Department */}
          <div className="space-y-2">
            <label className={LABEL_CLASS}>
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Department
            </label>
            <Select
              value={departmentId || NO_DEPARTMENT}
              onValueChange={(v) => setValue('departmentId', v === NO_DEPARTMENT ? '' : v)}
              disabled={isLoadingDepts}
            >
              <SelectTrigger className="h-10 text-sm font-display bg-surface/60 border-border/70 rounded-lg hover:border-border transition-all w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
                <SelectItem value={NO_DEPARTMENT} className="font-display text-xs text-text-muted">
                  No Department
                </SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="font-display text-xs">
                    <span className="flex items-center gap-2 truncate">
                      <Layers className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{d.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee Field */}
        <div className="space-y-2">
          <label className={LABEL_CLASS}>
            <User className="w-3.5 h-3.5 text-sky-400" /> Assignee
          </label>
          <Select
            value={assigneeId || UNASSIGNED}
            onValueChange={(v) => setValue('assigneeId', v === UNASSIGNED ? '' : v)}
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="h-10 text-sm font-display bg-surface/60 border-border/70 rounded-lg hover:border-border transition-all w-full">
              <SelectValue placeholder="Assign team member" />
            </SelectTrigger>
            <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
              <SelectItem value={UNASSIGNED} className="font-display text-xs text-text-muted">
                Unassigned
              </SelectItem>
              {assignableUsers?.map((u) => (
                <SelectItem key={u.id} value={u.id} className="font-display text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center justify-center text-[10px] font-display font-bold shrink-0">
                      {u.firstName?.[0]}
                    </div>
                    <span className="font-display font-medium text-text truncate">
                      {u.firstName} {u.lastName ?? ''}
                    </span>
                    <span className="text-[10px] font-display text-text-muted px-1.5 py-0.5 rounded bg-surface border border-border/50 shrink-0">
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 font-display flex items-start sm:items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 sm:mt-0" />
            <p className="leading-tight">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Failed to create task. Please try again.'}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};
