/**
 * Skeleton Loading Screen
 * 
 * Shows a skeleton UI pattern while the app initializes
 */

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="h-6 sm:h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 sm:h-10 w-20 sm:w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 sm:h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 p-2 sm:p-3 lg:p-4">
              {/* Day Header */}
              <div className="h-6 w-20 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              
              {/* Meeting Cards */}
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-gray-100 dark:bg-gray-700 rounded p-2 sm:p-3 animate-pulse">
                    <div className="h-4 w-3/4 mb-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 w-1/2 mb-1 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
