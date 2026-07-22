import { useNavigate } from 'react-router';
import { Home, RefreshCcw } from 'lucide-react';
import { Button } from '../button';

interface ErrorScreenProps {
  code?: string | number;
  title: string;
  message?: string;
  onRetry?: () => void;
}

// Shared visual shell for the 404 page and the route error boundary —
// same glass-card language as LoginForm/AuthBackground.
export const ErrorScreen = ({ code, title, message, onRetry }: ErrorScreenProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-svh items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-body)' }}
    >
      <span className="absolute -top-24 -left-24 size-72 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />
      <span className="absolute -bottom-24 -right-24 size-72 rounded-full bg-gold-400/20 blur-3xl pointer-events-none" />
      <span className="absolute top-1/3 right-16 size-40 rounded-full bg-primary-300/10 blur-2xl pointer-events-none" />

      <div
        className="relative z-10 w-full max-w-md text-center flex flex-col items-center gap-5 p-8 sm:p-10 rounded-2xl border shadow-xl animate-scale-in"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        {code && (
          <span className="text-6xl sm:text-7xl font-display font-bold text-primary-700 dark:text-primary-300 tracking-tight">
            {code}
          </span>
        )}

        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-display font-semibold text-text">{title}</h1>
          {message && (
            <p className="text-sm text-text-muted font-display max-w-sm">{message}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {onRetry && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
              <RefreshCcw size={14} />
              Try again
            </Button>
          )}
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
            <Home size={14} />
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
