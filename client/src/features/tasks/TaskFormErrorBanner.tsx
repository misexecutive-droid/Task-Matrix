import { AlertCircle } from 'lucide-react';

interface TaskFormErrorBannerProps {
  error: unknown;
  fallback: string;
}

export const TaskFormErrorBanner = ({ error, fallback }: TaskFormErrorBannerProps) => (
  <div className="flex items-start sm:items-center gap-3 p-3 mt-2 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger font-medium">
    <AlertCircle className="w-4 h-4 shrink-0 text-danger mt-0.5 sm:mt-0" />
    <p className="leading-snug">
      {error instanceof Error ? error.message : fallback}
    </p>
  </div>
);
