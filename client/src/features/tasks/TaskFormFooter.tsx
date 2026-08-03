import { ArrowRight } from 'lucide-react';
import { Button } from '../../components';

interface TaskFormFooterProps {
  onClose: () => void;
  isPending: boolean;
  isSubmitting: boolean;
}

export const TaskFormFooter = ({ onClose, isPending, isSubmitting }: TaskFormFooterProps) => (
  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={onClose}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      Cancel
    </Button>
    <Button
      type="submit"
      form="task-form"
      variant="primary"
      size="md"
      isLoading={isPending || isSubmitting}
      className="w-full sm:w-auto gap-1.5"
    >
      <span>Create Task</span>
    </Button>
  </div>
);
