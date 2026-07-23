import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Zap, 
  User, 
  Building2, 
  UserCheck, 
  AlertCircle,
  Sparkles
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
import { useCreateTicketMutation, useAssignableUsersQuery, useDepartmentsQuery } from './hook';

const ANY_DEPARTMENT = '__any__';
const UNASSIGNED = '__unassigned__';

const ticketSchema = z.object({
  title:          z.string().min(1, 'Title is required'),
  description:    z.string().min(1, 'Description is required'),
  priority:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignmentMode: z.enum(['AUTO', 'MANUAL']),
  departmentId:   z.string().optional().or(z.literal('')),
  assigneeId:     z.string().optional().or(z.literal('')),
  tatHours:       z.string().optional().refine(v => !v || Number(v) > 0, 'Must be a positive number'),
});

type TicketFields = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onClose: () => void;
}

const PRIORITIES: { value: TicketFields['priority']; label: string; activeClass: string }[] = [
  { value: 'LOW', label: 'Low', activeClass: 'border-blue-500/60 bg-blue-500/10 text-blue-400 ring-2 ring-blue-500/20' },
  { value: 'MEDIUM', label: 'Medium', activeClass: 'border-amber-500/60 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/20' },
  { value: 'HIGH', label: 'High', activeClass: 'border-orange-500/60 bg-orange-500/10 text-orange-400 ring-2 ring-orange-500/20' },
  { value: 'CRITICAL', label: 'Critical', activeClass: 'border-rose-500/60 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/20' },
];

const LABEL_CLASS = 'text-xs font-mono font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5';
const SELECT_CLASS = 'w-full px-3 h-9 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer hover:border-border/80';

export const TicketForm = ({ onClose }: TicketFormProps) => {
  const { data: departments } = useDepartmentsQuery();
  const mutation = useCreateTicketMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TicketFields>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'MEDIUM', assignmentMode: 'MANUAL' },
  });

  const assignmentMode = watch('assignmentMode');
  const departmentId   = watch('departmentId');
  const priority       = watch('priority');
  const assigneeId     = watch('assigneeId');
  const { data: assignableUsers } = useAssignableUsersQuery(departmentId || undefined);

  useEffect(() => {
    setValue('assigneeId', '');
  }, [departmentId, setValue]);

  const onSubmit = (data: TicketFields) => {
    mutation.mutate(
      {
        title:          data.title,
        description:    data.description,
        priority:       data.priority,
        assignmentMode: data.assignmentMode,
        departmentId:   data.departmentId !== '' ? data.departmentId : undefined,
        assigneeId:     data.assigneeId !== '' ? data.assigneeId : undefined,
        tatHours:       data.tatHours ? Number(data.tatHours) : (data.assignmentMode === 'AUTO' ? 24 : undefined),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      {/* 
        Scrollbar Hidden Styles Applied:
        - overflow-y-auto
        - [scrollbar-width:none] (Firefox)
        - [-ms-overflow-style:none] (IE/Edge)
        - [&::-webkit-scrollbar]:hidden (Chrome/Safari)
      */}
      <DialogContent className="sm:max-w-lg border-border/60 bg-surface/95 backdrop-blur-md shadow-2xl p-5 rounded-xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Header */}
        <DialogHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-text">
                Create New Ticket
              </DialogTitle>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Fill in the parameters to dispatch a task.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 mt-1" noValidate>

          {/* Title Input */}
          <Input
            id="title"
            label="Title"
            placeholder="e.g. Fix authentication timeout on mobile"
            error={errors.title?.message}
            className="font-mono text-sm h-9"
            {...register('title')}
          />

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="Describe the issue or expectations…"
              className="w-full px-3 py-2 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted/60 resize-none transition-all hover:border-border/80"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> {errors.description.message}
              </p>
            )}
          </div>

          {/* Priority Selector */}
          <div className="flex flex-col gap-1">
            <label className={LABEL_CLASS}>Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setValue('priority', p.value)}
                    className={`px-2 py-1.5 text-xs font-mono font-medium rounded-md border transition-all duration-200 text-center ${
                      isSelected
                        ? p.activeClass
                        : 'border-border/60 bg-surface/50 text-text-muted hover:bg-surface/80 hover:text-text'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignment Mode Toggle */}
          <div className="flex flex-col gap-1">
            <label className={LABEL_CLASS}>Assignment Strategy</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface-muted/50 border border-border/50 rounded-lg">
              <button
                type="button"
                onClick={() => setValue('assignmentMode', 'MANUAL')}
                className={`flex items-center justify-center gap-2 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                  assignmentMode === 'MANUAL'
                    ? 'bg-surface text-text shadow-sm border border-border/80'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Manual Dispatch
              </button>
              <button
                type="button"
                onClick={() => setValue('assignmentMode', 'AUTO')}
                className={`flex items-center justify-center gap-2 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                  assignmentMode === 'AUTO'
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-primary-400" /> Auto Assign
              </button>
            </div>
          </div>

          {/* Department & Assignee Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>
                <Building2 className="w-3.5 h-3.5" /> Department
              </label>
              <Select
                value={departmentId || ANY_DEPARTMENT}
                onValueChange={v => setValue('departmentId', v === ANY_DEPARTMENT ? '' : v)}
              >
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="Any department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_DEPARTMENT} className="font-mono text-xs">Any department</SelectItem>
                  {departments?.map(d => (
                    <SelectItem key={d.id} value={d.id} className="font-mono text-xs">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>
                <UserCheck className="w-3.5 h-3.5" /> Assignee
              </label>
              <Select
                value={assigneeId || UNASSIGNED}
                onValueChange={v => setValue('assigneeId', v === UNASSIGNED ? '' : v)}
              >
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED} className="font-mono text-xs">Unassigned</SelectItem>
                  {assignableUsers?.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-mono text-xs">
                      {u.firstName} {u.lastName ?? ''} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TAT Dynamic Field with Animated Height */}
          <AnimatePresence mode="wait">
            {assignmentMode === 'MANUAL' ? (
              <motion.div
                key="manual-tat"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Input
                  id="tatHours"
                  label="Turnaround Time (TAT Hours)"
                  type="number"
                  placeholder="e.g. 24"
                  error={errors.tatHours?.message}
                  className="font-mono text-sm h-9"
                  {...register('tatHours')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="auto-tat"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="p-2.5 rounded-md bg-primary-500/5 border border-primary-500/20 text-xs text-primary-400 font-mono flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-primary-400" />
                <span>Auto-assigned tickets are given a default TAT of <strong>24 hours</strong>.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Mutation Error */}
          {mutation.isError && (
            <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create ticket.'}
            </div>
          )}

          {/* Footer Actions */}
          <DialogFooter className="mt-1 pt-2 border-t border-border/40 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-mono">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending} className="font-mono">
              Create Ticket
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};