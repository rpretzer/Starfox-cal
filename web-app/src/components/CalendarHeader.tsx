import { useStore } from '../store/useStore';
import { ViewType, WeekTypeFilter } from '../types';

export default function CalendarHeader() {
  const { currentView, currentWeekType, settings, setCurrentView, setCurrentWeekType } = useStore();

  const availableViews: ViewType[] = ['weekly', 'conflicts', 'categories', 'teams'];
  if (settings.monthlyViewEnabled) {
    availableViews.push('monthly');
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {availableViews.map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentView === view
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Week:</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['A', 'B'] as WeekTypeFilter[]).map((week) => (
                <button
                  key={week}
                  onClick={() => setCurrentWeekType(week)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentWeekType === week
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

