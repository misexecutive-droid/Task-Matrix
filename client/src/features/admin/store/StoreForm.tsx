import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store as StoreIcon, AlertCircle } from 'lucide-react';
import { Input, Button, Modal } from '../../../components';
import { useCreateStoreMutation, useUpdateStoreMutation } from '../hook';
import type { Store } from '../../../api/stores';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
});

type StoreFields = z.infer<typeof storeSchema>;

interface StoreFormProps {
  onClose: () => void;
  store?: Store;
}

export const StoreForm = ({ onClose, store }: StoreFormProps) => {
  const isEditing = !!store;
  const createMutation = useCreateStoreMutation();
  const updateMutation = useUpdateStoreMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreFields>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: store?.name || '', code: store?.code || '', address: store?.address || '' },
  });

  const isPending = mutation.isPending;

  const onSubmit = (data: StoreFields) => {
    if (isEditing && store) {
      updateMutation.mutate({ id: store.id, payload: data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" form="store-form" variant="primary" size="sm" isLoading={isPending}>
        {isEditing ? 'Save changes' : 'Create store'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={() => !isPending && onClose()}
      icon={<StoreIcon className="w-5 h-5" />}
      title={isEditing ? 'Edit store' : 'New store'}
      description="Stores are where checklists actually run — each recurring checklist gets deployed to one or more."
      footer={footer}
    >
      <form id="store-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <fieldset disabled={isPending} className="flex flex-col gap-4 disabled:opacity-60">
          <Input id="name" label="Store name" placeholder="e.g. Karol Bagh" autoFocus error={errors.name?.message} {...register('name')} />
          <Input id="code" label="Code (optional)" placeholder="e.g. KB01" error={errors.code?.message} {...register('code')} />
          <Input id="address" label="Address (optional)" placeholder="e.g. 12 Main Market, Karol Bagh" error={errors.address?.message} {...register('address')} />
        </fieldset>

        {mutation.isError && (
          <div className="flex items-center gap-2 text-xs text-danger font-display bg-danger/10 p-2.5 rounded-lg">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? 'update' : 'create'} store.`}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};
