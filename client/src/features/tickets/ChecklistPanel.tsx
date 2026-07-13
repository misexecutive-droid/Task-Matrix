import { useState } from 'react';
import { Plus, Trash2, Loader2, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../components';
import {
  useAddChecklistMutation,
  useDeleteChecklistMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from './hook';
import type { Checklist } from '../../api/ticket';
import { useAuth } from '../../context/AuthContext';

interface ChecklistPanelProps {
  ticketId: string;
  checklists: Checklist[];
}

const ChecklistBlock = ({
  checklist,
  ticketId,
  isAdmin,
}: {
  checklist: Checklist;
  ticketId: string;
  isAdmin: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const updateItem = useUpdateChecklistItemMutation(ticketId);
  const deleteItem = useDeleteChecklistItemMutation(ticketId);
  const deleteChecklist = useDeleteChecklistMutation(ticketId);
  const doneCount = checklist.items.filter(i => i.isDone).length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">

      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          {open
            ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
            : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
          <span className="text-sm font-display font-medium text-slate-700 truncate">
            {checklist.title}
          </span>
          <span className="text-xs text-slate-400 font-display shrink-0 ml-1">
            {doneCount}/{checklist.items.length}
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => deleteChecklist.mutate(checklist.id)}
            disabled={deleteChecklist.isPending}
            className="text-slate-300 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 ml-2"
            aria-label="Delete checklist"
          >
            {deleteChecklist.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />}
          </button>
        )}
      </div>

      {open && (
        <div className="divide-y divide-slate-100">
          {checklist.items.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-slate-400 font-display">No items yet.</p>
          )}

          {checklist.items.map(item => (
            <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5 group hover:bg-slate-50 transition-colors">
              <button
                onClick={() => updateItem.mutate({ id: item.id, payload: { isDone: !item.isDone } })}
                disabled={updateItem.isPending}
                className="shrink-0 cursor-pointer disabled:opacity-50"
                aria-label={item.isDone ? 'Mark undone' : 'Mark done'}
              >
                {item.isDone
                  ? <CheckSquare size={15} className="text-primary-600" />
                  : <Square size={15} className="text-slate-300" />}
              </button>

              <span className={`flex-1 text-sm font-display min-w-0 truncate ${item.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {item.label}
              </span>

              {item.dueAt && (
                <span className="text-xs text-slate-400 font-display shrink-0">
                  {new Date(item.dueAt).toLocaleDateString()}
                </span>
              )}

              {isAdmin && (
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  disabled={deleteItem.isPending}
                  className="shrink-0 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                  aria-label="Delete item"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ChecklistPanel = ({ ticketId, checklists }: ChecklistPanelProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const addChecklist = useAddChecklistMutation(ticketId);

  const handleAdd = () => {
    if (!title.trim()) return;
    addChecklist.mutate(
      { title: title.trim() },
      { onSuccess: () => { setTitle(''); setAdding(false); } },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-slate-700">Checklists</h3>
        {isAdmin && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Add list
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Checklist title…"
            className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-primary-500 placeholder:text-slate-400"
          />
          <Button size="sm" variant="primary" onClick={handleAdd} isLoading={addChecklist.isPending}>
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      )}

      {checklists.length === 0 && !adding && (
        <p className="text-xs text-slate-400 font-display py-2">No checklists yet.</p>
      )}

      {checklists.map(cl => (
        <ChecklistBlock key={cl.id} checklist={cl} ticketId={ticketId} isAdmin={isAdmin} />
      ))}
    </div>
  );
};
