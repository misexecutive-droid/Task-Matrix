import { CheckSquare, FileText } from 'lucide-react';
import { LABEL_CLASS, INPUT_BASE_CLASS } from './formConstants';

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
  <>
    <div className="space-y-2">
      <label htmlFor="checklist-name" className={LABEL_CLASS}>
        <CheckSquare className="w-3.5 h-3.5 text-primary-400" /> Checklist Name
      </label>
      <input
        id="checklist-name"
        placeholder="e.g. Store Opening Checklist"
        className={`${INPUT_BASE_CLASS} h-10`}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
      />
    </div>

    <div className="space-y-2">
      <label htmlFor="checklist-description" className={LABEL_CLASS}>
        <FileText className="w-3.5 h-3.5 text-text-muted" /> Description
        <span className="normal-case font-normal text-text-muted/70 tracking-normal ml-1">(Optional)</span>
      </label>
      <textarea
        id="checklist-description"
        rows={3}
        placeholder="What is this checklist for?"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className={`${INPUT_BASE_CLASS} resize-none leading-relaxed`}
      />
    </div>
  </>
);
