import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Ticket, AlertCircle } from 'lucide-react';

import { Button, Modal } from '../../components';
import { useCreateTicketMutation, useAssignableUsersQuery, useDepartmentsQuery } from './hook';
import { useCategoriesQuery } from '../settings/hook';
import { ticketApi } from '../../api/ticket';
import { ticketSchema, type TicketFields } from './form/ticketFormSchema';
import { AssignmentModeToggle } from './form/AssignmentModeToggle';
import { CategoryField } from './form/CategoryField';
import { TicketDetailsFields } from './form/TicketDetailsFields';
import { PhotoUploadField } from './form/PhotoUploadField';
import { PriorityField } from './form/PriorityField';
import { DepartmentAssigneeFields } from './form/DepartmentAssigneeFields';
import { DueDateField } from './form/DueDateField';

interface TicketFormProps {
  onClose: () => void;
}

export const TicketForm = ({ onClose }: TicketFormProps) => {
  const { data: departments } = useDepartmentsQuery();
  const { data: categories } = useCategoriesQuery();
  const mutation = useCreateTicketMutation();
  const queryClient = useQueryClient();

  const [photos, setPhotos] = useState<File[]>([]);
  const addPhotos = (files: FileList | null) => {
    if (!files || !files.length) return;
    setPhotos(prev => [...prev, ...Array.from(files)]);
  };
  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, idx) => idx !== index));

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

  const footer = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-display">
        Cancel
      </Button>
      <Button type="submit" form="ticket-form" variant="primary" size="sm" isLoading={mutation.isPending} className="font-display">
        Create Ticket
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      icon={<Ticket className="w-5 h-5" />}
      title="Create New Ticket"
      description="Fill in the parameters to dispatch a task."
      footer={footer}
      contentClassName="
        left-0 right-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full
        sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%]
        rounded-t-2xl rounded-b-none sm:rounded-2xl
        max-h-[92dvh] sm:max-h-[90vh]
        data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8
        sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0
        data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100
        sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95
      "
    >
      {/* Sheet drag handle — mobile only, signals "this is a bottom sheet" */}
      <div className="sm:hidden flex justify-center -mt-4 mb-1 shrink-0">
        <div className="h-1.5 w-10 rounded-full bg-border/70" />
      </div>

      <form id="ticket-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-6" noValidate>
        <AssignmentModeToggle mode={assignmentMode} onChange={m => setValue('assignmentMode', m)} />

        <CategoryField
          categoryId={categoryId}
          onChange={v => setValue('categoryId', v)}
          categories={categories}
        />

        <TicketDetailsFields register={register} errors={errors} />

        <PhotoUploadField photos={photos} onAddPhotos={addPhotos} onRemovePhoto={removePhoto} />

        <PriorityField value={priority} onChange={v => setValue('priority', v)} />

        <DepartmentAssigneeFields
          departmentId={departmentId}
          onDepartmentChange={v => setValue('departmentId', v)}
          departments={departments}
          assigneeId={assigneeId}
          onAssigneeChange={v => setValue('assigneeId', v)}
          assignableUsers={assignableUsers}
          locked={!!selectedCategory}
        />

        <DueDateField
          mode={assignmentMode}
          register={register}
          errors={errors}
          categoryTatHours={selectedCategory?.tatHours}
        />

        {/* Global Mutation Error */}
        {mutation.isError && (
          <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-display flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to create ticket.'}
          </div>
        )}
      </form>
    </Modal>
  );
};
