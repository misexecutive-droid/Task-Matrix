import { useState, useMemo } from 'react';
import { Plus, Store as StoreIcon, AlertCircle, Inbox } from 'lucide-react';
import { Skeleton } from '../../../components';
import { useStoresQuery } from '../../tickets/hook';
import { useUsersQuery, useUpdateStoreMutation, useDeleteStoreMutation } from '../hook';
import { StoreCard } from './StoreCard';
import { StoreForm } from './StoreForm';
import type { Store } from '../../../api/stores';

export const StoreList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const { data: stores = [], isPending, isError } = useStoresQuery();
  const { data: users } = useUsersQuery();
  const updateMut = useUpdateStoreMutation();
  const deleteMut = useDeleteStoreMutation();

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (users ?? []).forEach(u => {
      if (u.storeId) counts.set(u.storeId, (counts.get(u.storeId) ?? 0) + 1);
    });
    return counts;
  }, [users]);

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStore(null);
  };

  const activeModal = showForm || editingStore;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Stores</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {stores.length} store{stores.length !== 1 ? 's' : ''} configured — checklists deploy to one or more of these.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-display font-semibold text-white rounded-xl shadow-sm bg-gradient-to-b from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          New Store
        </button>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface h-44">
              <div className="flex items-center justify-between">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-display font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load stores. Please check your connection and try again.</p>
        </div>
      )}

      {!isPending && !isError && stores.length === 0 && (
        <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-surface-hover/40 text-center">
          <div className="mb-5 text-text-muted">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-2">No stores yet</h3>
          <p className="text-sm text-text-muted max-w-sm mb-8">
            Add your first store before creating recurring checklists — every checklist template deploys to one or more stores.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-display font-semibold rounded-xl shadow-sm bg-surface text-text-secondary border border-border transition-all duration-300 hover:bg-surface-hover hover:text-primary-600 hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <StoreIcon className="w-4 h-4" />
            Create Store
          </button>
        </section>
      )}

      {!isPending && !isError && stores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stores.map(s => (
            <StoreCard
              key={s.id}
              store={s}
              memberCount={memberCounts.get(s.id) ?? 0}
              isUpdating={updateMut.isPending && updateMut.variables?.id === s.id}
              isDeleting={deleteMut.isPending && deleteMut.variables === s.id}
              onToggleActive={toggleActive}
              onEdit={setEditingStore}
              onDelete={deleteMut.mutate}
            />
          ))}
        </div>
      )}

      {activeModal && <StoreForm onClose={closeForm} store={editingStore ?? undefined} />}
    </div>
  );
};
