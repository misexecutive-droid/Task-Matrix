function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-red-600">An unexpected error occurred</h1>
      <p className="text-lg text-gray-700">{error.message}</p>
    </div>
  );
}

export default ErrorFallback;
