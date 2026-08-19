import { useState, type FormEvent } from 'react';
import { ListTodo } from 'lucide-react';
import { Button, Modal, Input } from '../../components';
import { TaskFormPrioritySelector } from '../tasks/TaskFormPrioritySelector';
import { useCreateTodoMutation } from './hook';
import type { TodoPriority } from '../../api/todos';

interface CreateTodoModalProps {
  open: boolean;
  onClose: () => void;
}

// Shared by the To-Do page's "Todo Task" button and the Dashboard header's — same quick-add
// modal, opened directly from wherever the user is instead of navigating to the To-Do page first.
export const CreateTodoModal = ({ open, onClose }: CreateTodoModalProps) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');

  const createMut = useCreateTodoMutation();

  if (!open) return null;

  const closeAndReset = () => {
    onClose();
    setText('');
    setDueDate('');
    setPriority('medium');
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    createMut.mutate(
      { text: trimmed, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined },
      { onSuccess: closeAndReset },
    );
  };

  return (
    <Modal
      open
      onClose={closeAndReset}
      icon={<ListTodo className="w-5 h-5" />}
      title="New todo task"
      description="A quick task just for yourself — not assigned to anyone else."
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={closeAndReset}>Cancel</Button>
          <Button type="submit" form="todo-form" variant="primary" size="sm" isLoading={createMut.isPending}>
            Add task
          </Button>
        </>
      }
    >
      <form id="todo-form" onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
        <Input
          autoFocus
          label="Task"
          placeholder="e.g. Follow up with the vendor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
        />

        <Input
          type="date"
          label="Due date (optional)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <TaskFormPrioritySelector value={priority} onChange={setPriority} />
      </form>
    </Modal>
  );
};
