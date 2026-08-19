import { Trash2, Check, ListTodo, CalendarClock } from 'lucide-react';
import { Loader, Skeleton } from '../../components';
import { ErrorMessage, EmptyState } from '../admin/adminDisplay';
import { PRIORITY_MAP } from '../tasks/taskDisplay';
import { useTodosQuery, useUpdateTodoMutation, useDeleteTodoMutation } from './hook';
import type { Todo } from '../../api/todos';

// Self-contained: fetches and mutates its own data, so it drops in identically on the full
// /todo page and inside the Dashboard's TodoDrawer with no props to thread through.
export const TodoList = () => {
  const { data: todos = [], isPending, isError } = useTodosQuery();
  const updateMut = useUpdateTodoMutation();
  const deleteMut = useDeleteTodoMutation();

  const toggleComplete = (id: string, completed: boolean) => {
    updateMut.mutate({ id, payload: { completed: !completed } });
  };

  const renderRow = (todo: Todo) => {
    const isToggling = updateMut.isPending && updateMut.variables?.id === todo.id;
    const isDeleting = deleteMut.isPending && deleteMut.variables === todo.id;
    const priorityMeta = PRIORITY_MAP[todo.priority];
    const overdue = !!todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

    return (
      <div
        key={todo.id}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface transition-all ${
          isDeleting ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => toggleComplete(todo.id, todo.completed)}
          disabled={isToggling}
          aria-pressed={todo.completed}
          aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
          className={`mt-0.5 shrink-0 size-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 cursor-pointer disabled:cursor-wait ${
            todo.completed ? 'bg-primary-600 border-primary-600' : 'border-border-hover hover:border-primary-400'
          }`}
        >
          {isToggling ? (
            <Loader size="sm" variant="slate" className="w-3 h-3" />
          ) : (
            todo.completed && <Check size={12} className="text-white" strokeWidth={3} />
          )}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p
            className={`text-sm font-display truncate transition-colors duration-200 ${
              todo.completed ? 'text-text-light line-through' : 'text-text'
            }`}
          >
            {todo.text}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-display font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${priorityMeta.className}`}>
              {priorityMeta.label}
            </span>
            {todo.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] font-display ${overdue ? 'text-danger font-semibold' : 'text-text-muted'}`}>
                <CalendarClock size={11} />
                {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => deleteMut.mutate(todo.id)}
          disabled={isDeleting}
          aria-label="Delete todo"
          className="mt-0.5 shrink-0 p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        >
          {isDeleting ? <Loader size="sm" variant="rose" className="w-3.5 h-3.5" /> : <Trash2 size={14} />}
        </button>
      </div>
    );
  };

  if (isPending) return <TodoListSkeleton />;
  if (isError) return <ErrorMessage message="Failed to load your to-dos." />;
  if (todos.length === 0) {
    return (
      <EmptyState
        label="Nothing on your list yet"
        description="Add a to-do task for yourself and check it off once it's done."
        Icon={ListTodo}
      />
    );
  }

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {pending.map(renderRow)}
      </div>

      {completed.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-display font-semibold uppercase tracking-wide text-text-light px-1">
            Completed ({completed.length})
          </p>
          {completed.map(renderRow)}
        </div>
      )}
    </div>
  );
};

const TodoListSkeleton = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
        <Skeleton className="size-5 rounded-md shrink-0" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="size-7 rounded-md shrink-0" />
      </div>
    ))}
  </div>
);
