interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-red-500 dark:text-red-400 text-5xl mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
          Failed to Initialize
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">{error}</p>
        <button
          onClick={onRetry}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

