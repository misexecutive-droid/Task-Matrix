import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { Input, Button, UserMultiSelect, Modal, Combobox } from '../../components';
import { useCreateCategoryMutation, useUpdateCategoryMutation, useDepartmentsQuery } from './hook';
import type { Category } from '@/api/categories';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  assigneeIds: z.array(z.string()).optional(),
  tatHours: z
    .string()
    .optional()
    .refine(v => !v || (/^\d+$/.test(v) && Number(v) > 0), 'Enter a positive number of hours'),
});

type CategoryFields = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onClose: () => void;
  category?: Category;
}

export const CategoryForm = ({ onClose, category }: CategoryFormProps) => {
  const isEditing = !!category;
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const { data: departments, isPending: isDepartmentsLoading } = useDepartmentsQuery();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CategoryFields>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      departmentId: category?.departmentId?.id ?? '',
      assigneeIds: category?.assigneeIds?.map(u => u.id) ?? [],
      tatHours: category?.tatHours ? String(category.tatHours) : '',
    },
  });

  const departmentId = watch('departmentId');

  const onSubmit = (data: CategoryFields) => {
    const payload = {
      name: data.name,
      departmentId: data.departmentId,
      assigneeIds: data.assigneeIds ?? [],
      tatHours: data.tatHours ? Number(data.tatHours) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: category.id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="category-form" variant="primary" size="sm" isLoading={mutation.isPending}>
        {isEditing ? "Save changes" : "Create category"}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      icon={<Tag className="w-5 h-5" />}
      title={isEditing ? "Edit category" : "New category"}
      description="Selecting this category on a ticket will auto-fill its department, default assignees, and TAT."
      footer={footer}
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="name"
          label="Category name"
          placeholder="e.g. Fan Issue"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="departmentId" className="text-sm font-display font-medium text-text-secondary">
            Department
          </label>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Combobox
                id="departmentId"
                value={field.value}
                onChange={field.onChange}
                isLoading={isDepartmentsLoading}
                placeholder="Search departments..."
                options={(departments ?? []).map(d => ({ value: d.id, label: d.name }))}
              />
            )}
          />
          {errors.departmentId?.message && (
            <span className="text-xs font-medium text-danger">{errors.departmentId.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-display font-medium text-text-secondary">
            Default assignees
          </label>
          <Controller
            control={control}
            name="assigneeIds"
            render={({ field }) => (
              <UserMultiSelect
                departmentId={departmentId || undefined}
                selected={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <Input
          id="tatHours"
          label="TAT (hours)"
          placeholder="Leave blank to use the system default"
          suffix={<span className="text-xs text-text-light">hrs</span>}
          error={errors.tatHours?.message}
          {...register('tatHours')}
        />

        {mutation.isError && (
          <p className="text-xs text-danger text-center">
            {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? "update" : "create"} category.`}
          </p>
        )}
      </form>
    </Modal>
  );
};
