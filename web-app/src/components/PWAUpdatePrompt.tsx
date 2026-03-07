interface PWAUpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function PWAUpdatePrompt({ onUpdate, onDismiss }: PWAUpdatePromptProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="App update available"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-lg px-4 py-3 max-w-sm w-full mx-4"
    >
      <div className="flex-shrink-0 text-blue-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        A new version is available
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUpdate}
          className="bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Update
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss update prompt"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
