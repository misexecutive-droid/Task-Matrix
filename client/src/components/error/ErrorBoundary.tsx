import { useRouteError, isRouteErrorResponse } from 'react-router';
import { ErrorScreen } from './ErrorScreen';

function MyErrorBoundary() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error('Route error:', error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <ErrorScreen
          code={404}
          title="Page not found"
          message="The page you're looking for doesn't exist or may have been moved."
        />
      );
    }

    return (
      <ErrorScreen
        code={error.status}
        title="Something went wrong"
        message={error.statusText || 'An unexpected error occurred while loading this page.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <ErrorScreen
      title="Something went wrong"
      message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
      onRetry={() => window.location.reload()}
    />
  );
}

export default MyErrorBoundary;
