import { ErrorScreen } from './ErrorScreen';

function NotFoundPage() {
  return (
    <ErrorScreen
      code={404}
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
    />
  );
}

export default NotFoundPage;
