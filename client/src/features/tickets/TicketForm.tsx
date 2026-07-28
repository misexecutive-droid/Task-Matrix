import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Zap,
  User,
  Building2,
  UserCheck,
  AlertCircle,
  Sparkles,
  UploadCloud,
  X,
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
import { useCategoriesQuery } from '../settings/hook';
import { ticketApi } from '../../api/ticket';

const ANY_DEPARTMENT = '__any__';
const UNASSIGNED = '__unassigned__';
const NO_CATEGORY = '__none__';

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignmentMode: z.enum(['AUTO', 'MANUAL']),
  categoryId: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  assigneeId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  dueTime: z.string().optional().or(z.literal('')),
}).refine(
  (data) => data.assignmentMode !== 'MANUAL' || (!!data.dueDate && !!data.dueTime),
  { message: 'Pick a due date and time', path: ['dueDate'] },
).refine(
  (data) => {
    if (data.assignmentMode !== 'MANUAL' || !data.dueDate || !data.dueTime) return true;
    return new Date(`${data.dueDate}T${data.dueTime}`).getTime() > Date.now();
  },
  { message: 'Due date/time must be in the future', path: ['dueTime'] },
)


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

const LABEL_CLASS = 'text-xs font-display font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5';
const SELECT_CLASS = 'w-full px-3 h-10 text-base sm:text-sm font-display bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer hover:border-border/80';
const SELECT_CLASS_DISABLED = `${SELECT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`;

export const TicketForm = ({ onClose }: TicketFormProps) => {
  const { data: departments } = useDepartmentsQuery();
  const { data: categories } = useCategoriesQuery();
  const mutation = useCreateTicketMutation();
  const queryClient = useQueryClient();

  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addPhotos = (files: FileList | null) => {
    if (!files || !files.length) return;
    setPhotos(prev => [...prev, ...Array.from(files)]);
  };

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
  const categoryId = watch('categoryId');
  const departmentId = watch('departmentId');
  const priority = watch('priority');
  const assigneeId = watch('assigneeId');
  const { data: assignableUsers } = useAssignableUsersQuery(departmentId || undefined);

  const selectedCategory = categories?.find(c => c.id === categoryId);

  useEffect(() => {
    if (categoryId) return;
    setValue('assigneeId', '');
  }, [departmentId, categoryId, setValue]);

  useEffect(() => {
    if (!selectedCategory) return;

    setValue('departmentId', selectedCategory.departmentId.id);
    setValue('assigneeId', selectedCategory.assigneeIds[0]?.id ?? '');

    if (selectedCategory.tatHours) {
      const due = new Date(Date.now() + selectedCategory.tatHours * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setValue('dueDate', `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`);
      setValue('dueTime', `${pad(due.getHours())}:${pad(due.getMinutes())}`);
    }
  }, [selectedCategory, setValue]);

  const onSubmit = (data: TicketFields) => {
    const tatHours = data.assignmentMode === 'MANUAL' && data.dueDate && data.dueTime
      ? Math.max(1, Math.ceil((new Date(`${data.dueDate}T${data.dueTime}`).getTime() - Date.now()) / (60 * 60 * 1000)))
      : undefined;

    mutation.mutate(
      {
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignmentMode: data.assignmentMode,
        categoryId: data.categoryId !== '' ? data.categoryId : undefined,
        departmentId: data.departmentId !== '' ? data.departmentId : undefined,
        assigneeId: data.assigneeId !== '' ? data.assigneeId : undefined,
        tatHours: tatHours ?? (data.assignmentMode === 'AUTO' ? (selectedCategory?.tatHours ?? 24) : undefined),
      },
      {
        onSuccess: async (created) => {
          if (photos.length) {
            try {
              await ticketApi.uploadAttachments(created.id, photos);
              queryClient.invalidateQueries({ queryKey: ['tickets'] });
            } catch {
              toast.error('Ticket created, but the photos failed to attach — add them from the ticket detail view instead.');
            }
          }
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
     
      <DialogContent
        className="
          left-0 right-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full
          sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-xl
          border-t border-x-0 border-b-0 sm:border border-border/60
          bg-surface/95 backdrop-blur-md shadow-2xl p-0
          rounded-t-2xl rounded-b-none sm:rounded-2xl
          max-h-[92dvh] sm:max-h-[90vh]
          flex flex-col overflow-hidden
          data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8
          sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0
          data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100
          sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95
        "
      >
        {/* Sheet drag handle — mobile only, signals "this is a bottom sheet" */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="h-1.5 w-10 rounded-full bg-border/70" />
        </div>

        {/* Header */}
        <DialogHeader className="shrink-0 px-5 sm:px-7 pt-3 sm:pt-7 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-text truncate">
                Create New Ticket
              </DialogTitle>
              <p className="text-xs text-text-muted font-display mt-0.5 truncate">
                Fill in the parameters to dispatch a task.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0" noValidate>
          <div className="flex flex-col gap-5 sm:gap-6 px-5 sm:px-7 py-5 sm:py-6 overflow-y-auto flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

             {/* Assignment Mode Toggle   */}
            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Assignment Strategy</label>
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-surface-muted/50 border border-border/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setValue('assignmentMode', 'MANUAL')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-1 text-xs font-display font-medium rounded-md transition-all text-center ${assignmentMode === 'MANUAL'
                      ? 'bg-surface text-text shadow-sm border border-border/80'
                      : 'text-text-muted hover:text-text'
                    }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Manual Dispatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('assignmentMode', 'AUTO')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-1 text-xs font-display font-medium rounded-md transition-all text-center ${assignmentMode === 'AUTO'
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
                      : 'text-text-muted hover:text-text'
                    }`}
                >
                  <Zap className="w-3.5 h-3.5 text-primary-400 shrink-0" /> <span className="truncate">Auto Assign</span>
                </button>
              </div>
            </div>

            {/* Category Selector — picking one auto-fills department, default assignee, and TAT below */}
            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>
                <Sparkles className="w-3.5 h-3.5" /> Category
              </label>
              <Select
                value={categoryId || NO_CATEGORY}
                onValueChange={v => setValue('categoryId', v === NO_CATEGORY ? '' : v)}
              >
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY} className="font-display text-xs">No category</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-display text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title Input */}
            <Input
              id="title"
              label="Title"
              placeholder="e.g. Fix authentication timeout on mobile"
              error={errors.title?.message}
              className="font-display"
              {...register('title')}
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className={LABEL_CLASS}>
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the issue or expectations…"
                className="w-full px-3 py-2.5 text-base sm:text-sm font-display bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted/60 resize-none transition-all hover:border-border/80"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 flex items-center gap-1 font-display">
                  <AlertCircle className="w-3 h-3" /> {errors.description.message}
                </p>
              )}
            </div>

            {/* Photos — attach a picture of the issue right away, instead of having to reopen the
              ticket afterward. Uploaded via the existing ticket-attachments endpoint once the
              ticket itself has been created (see onSubmit above). */}
            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Photos (optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group border border-dashed border-border/80 hover:border-primary-500/50 bg-surface/40 hover:bg-primary-500/5 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { addPhotos(e.target.files); e.target.value = ''; }}
                />
                <div className="p-2 rounded-full bg-surface-muted group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-1.5">
                  <UploadCloud className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
                  Click to attach a picture of the issue
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">PNG, JPG, WEBP up to 10MB</p>
              </div>

              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((file, i) => (
                    <div key={i} className="relative size-16 rounded-lg border border-border overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 size-4 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-danger cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Priority Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue('priority', p.value)}
                      className={`px-2 py-3 sm:py-2.5 text-xs font-display font-medium rounded-md border transition-all duration-200 text-center ${isSelected
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

           

            {/* Department & Assignee Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={LABEL_CLASS}>
                  <Building2 className="w-3.5 h-3.5" /> Department
                </label>
                <Select
                  value={departmentId || ANY_DEPARTMENT}
                  onValueChange={v => setValue('departmentId', v === ANY_DEPARTMENT ? '' : v)}
                  disabled={!!selectedCategory}
                >
                  <SelectTrigger className={SELECT_CLASS_DISABLED}>
                    <SelectValue placeholder="Any department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_DEPARTMENT} className="font-display text-xs">Any department</SelectItem>
                    {departments?.map(d => (
                      <SelectItem key={d.id} value={d.id} className="font-display text-xs">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className={LABEL_CLASS}>
                  <UserCheck className="w-3.5 h-3.5" /> Assignee
                </label>
                <Select
                  value={assigneeId || UNASSIGNED}
                  onValueChange={v => setValue('assigneeId', v === UNASSIGNED ? '' : v)}
                  disabled={!!selectedCategory}
                >
                  <SelectTrigger className={SELECT_CLASS_DISABLED}>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED} className="font-display text-xs">Unassigned</SelectItem>
                    {assignableUsers?.map(u => (
                      <SelectItem key={u.id} value={u.id} className="font-display text-xs">
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
                  className="grid grid-cols-2 gap-3"
                >
                  <Input
                    id="dueDate"
                    label="Due date"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    error={errors.dueDate?.message}
                    className="font-display"
                    {...register('dueDate')}
                  />
                  <Input
                    id="dueTime"
                    label="Due time"
                    type="time"
                    error={errors.dueTime?.message}
                    className="font-display"
                    {...register('dueTime')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="auto-tat"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-3 rounded-md bg-primary-500/5 border border-primary-500/20 text-xs text-primary-400 font-display flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-primary-400" />
                  <span>
                    Auto-assigned tickets are given a default TAT of{' '}
                    <strong>{selectedCategory?.tatHours ?? 24} hours</strong>
                    {selectedCategory?.tatHours ? ' (from this category)' : ''}.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global Mutation Error */}
            {mutation.isError && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-display flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to create ticket.'}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="shrink-0 px-5 sm:px-7 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-border/40 gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-display">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending} className="font-display">
              Create Ticket
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};
