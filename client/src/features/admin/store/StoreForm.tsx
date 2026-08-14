import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store as StoreIcon, X, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '../../../components';
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

  const onSubmit = (data: StoreFields) => {
    if (isEditing && store) {
      updateMutation.mutate({ id: store.id, payload: data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <header className="relative p-6 border-b border-border bg-surface-hover/40">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-text-light hover:text-text hover:bg-surface-hover rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="flex items-center justify-center text-coral-600 dark:text-coral-400 shrink-0">
              <StoreIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold text-text tracking-tight">
                {isEditing ? 'Edit Store' : 'New Store'}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Stores are where checklists actually run — each recurring checklist gets deployed to one or more.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
          <div className="p-6 space-y-4">
            <Input id="name" label="Store Name" placeholder="e.g. Karol Bagh" autoFocus error={errors.name?.message} {...register('name')} />
            <Input id="code" label="Code (optional)" placeholder="e.g. KB01" error={errors.code?.message} {...register('code')} />
            <Input id="address" label="Address (optional)" placeholder="e.g. 12 Main Market, Karol Bagh" error={errors.address?.message} {...register('address')} />

            {mutation.isError && (
              <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-danger">
                  {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? 'update' : 'create'} store. Please try again.`}
                </p>
              </div>
            )}
          </div>

          <footer className="p-4 sm:p-6 pt-0 mt-auto flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-display font-semibold text-text-secondary bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-display font-semibold text-white rounded-xl shadow-sm bg-gradient-to-b from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create store'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
