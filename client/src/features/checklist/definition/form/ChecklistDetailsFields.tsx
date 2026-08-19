import { CheckSquare, FileText } from 'lucide-react';
import { Input, Textarea } from '../../../../components';

interface ChecklistDetailsFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

// Name + description — the free-text identity of the checklist.
export const ChecklistDetailsFields = ({
  name,
  onNameChange,
  description,
  onDescriptionChange,
}: ChecklistDetailsFieldsProps) => (
  <div className="flex flex-col gap-4">
    <Input
      id="checklist-name"
      label="Checklist Name"
      icon={CheckSquare}
      iconClassName="text-primary-400"
      placeholder="e.g. Store Opening Checklist"
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      autoFocus
    />

    <Textarea
      id="checklist-description"
      label={<>Description <span className="text-text-muted/70 font-normal">(Optional)</span></>}
      icon={FileText}
      rows={3}
      placeholder="What is this checklist for?"
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
    />
  </div>
);
