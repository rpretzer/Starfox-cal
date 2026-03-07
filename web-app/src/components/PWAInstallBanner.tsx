interface PWAInstallBannerProps {
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

export default function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  return (
    <div
      role="complementary"
      aria-label="Install app banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 max-w-sm w-full mx-4"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
        SF
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          Install Starfox Calendar
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Add to home screen for offline access
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onInstall}
          className="bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss install banner"
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
