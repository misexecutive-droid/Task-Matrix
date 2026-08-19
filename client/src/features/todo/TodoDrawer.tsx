import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ListTodo, Plus } from 'lucide-react';
import { Button } from '../../components';
import { TodoList } from './TodoList';
import { CreateTodoModal } from './CreateTodoModal';

interface TodoDrawerProps {
  open: boolean;
  onClose: () => void;
}

// A right-side slide-in panel for the Dashboard's "Todo Task" shortcut — shows the existing list
// right away instead of jumping straight to a blank add-task form; "Add todo" inside it opens the
// same CreateTodoModal used everywhere else.
export const TodoDrawer = ({ open, onClose }: TodoDrawerProps) => {
  const [showCreate, setShowCreate] = useState(false);

  // Portalled to <body> — DashboardHeader (where this is triggered from) has `overflow-hidden` on
  // its own root div for the LightBeams effect, which would otherwise clip this fixed-position
  // panel to the header's own bounding box instead of the full viewport.
  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your to-do list"
        aria-hidden={!open}
        className={`fixed top-0 bottom-0 right-0 z-[60] w-full sm:w-96 max-w-[90vw] bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
              <ListTodo size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-display font-semibold text-text truncate">Your To-Do List</h2>
              <p className="text-xs text-text-muted truncate">Personal tasks, just for you</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-full text-text-light hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 shrink-0 border-b border-border/60">
          <Button size="sm" variant="primary" className="w-full gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Add todo
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
          <TodoList />
        </div>
      </aside>

      <CreateTodoModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>,
    document.body,
  );
};
