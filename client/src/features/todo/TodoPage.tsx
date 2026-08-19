import { useState } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { Button } from '../../components';
import { TodoList } from './TodoList';
import { CreateTodoModal } from './CreateTodoModal';

export const TodoPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <ListTodo size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-text">To-Do</h1>
            <p className="text-sm text-text-muted mt-0.5">Your own personal task list — add it, then check it off when it's done.</p>
          </div>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Todo Task
        </Button>
      </div>

      <TodoList />

      <CreateTodoModal open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
};
