import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Input, Button, Form } from '../../components';
import { useCreateDepartmentMutation } from './hooks';

// Only one rule: name must be present. Compare to userSchema in UserForm.tsx,
// which validates 5 fields — this form is simpler because Department itself
// is a simpler model (see server/src/models/Department.ts: just name + isActive).
const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

type DepartmentFields = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  onClose: () => void;
}

export const DepartmentForm = ({ onClose }: DepartmentFormProps) => {
  const mutation = useCreateDepartmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFields>({
    resolver: zodResolver(departmentSchema),
  });

  const onSubmit = (data: DepartmentFields) => {
    mutation.mutate(data, { onSuccess: () => onClose() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl  flex flex-col gap-6 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-slate-900">New department</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            id="name"
            label="Department name"
            placeholder="e.g. Customer Support"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* This is where the server's 409 "Name already exists" error (thrown by
              createLookupRouter when you try to create a duplicate) will show up,
              since apiFetch turns any non-ok response into a thrown Error with
              that message attached. */}

          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create department.'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>Create department</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
