import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from './hooks';
import type { Department } from '../../api/departments';

// Only one rule: name must be present. Compare to userSchema in UserForm.tsx,
// which validates 5 fields — this form is simpler because Department itself
// is a simpler model (see server/src/models/Department.ts: just name + isActive).
const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

type DepartmentFields = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  onClose: () => void;
  department?: Department;
}

export const DepartmentForm = ({ onClose, department }: DepartmentFormProps) => {
  const isEditing = !!department;
  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();

  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFields>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: department?.name }
  });

  const onSubmit = (data: DepartmentFields) => {
    if (isEditing) {
      updateMutation.mutate({ id: department.id, payload: data }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-primary-500 shrink-0" />
            <div>
              <DialogTitle>{isEditing ? "Edit department" : "New department"}</DialogTitle>
              <p className="text-xs text-text-muted mt-0.5">
                {isEditing ? "Update this department's name." : "Departments group users and scope checklist assignments."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            id="name"
            label="Department name"
            placeholder="e.g. Customer Support"
            error={errors.name?.message}
            {...register('name')}
          />

          {mutation.isError && (
            <p className="text-xs text-danger text-center">
              {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? "update" : "create"} department.`}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>{isEditing ? "Save changes" : "Create department"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};