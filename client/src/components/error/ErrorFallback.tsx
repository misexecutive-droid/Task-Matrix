import { ErrorScreen } from './ErrorScreen';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <ErrorScreen
      title="Something went wrong"
      message={error.message || 'An unexpected error occurred.'}
      onRetry={() => window.location.reload()}
    />
  );
}

export default ErrorFallback;
