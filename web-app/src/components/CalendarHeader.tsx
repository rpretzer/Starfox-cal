import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ViewType, WeekTypeFilter } from '../types';
import { DAYS_OF_WEEK } from '../constants';

export default function CalendarHeader() {
  const { currentView, currentWeekType, settings, setCurrentView, setCurrentWeekType, getConflictsForDay, meetings } = useStore();
  const [hasConflicts, setHasConflicts] = useState(false);

  // Check for conflicts
  useEffect(() => {
    const checkConflicts = async () => {
      let conflictsFound = false;
      for (const day of DAYS_OF_WEEK) {
        const dayConflicts = await getConflictsForDay(day);
        if (dayConflicts.length > 0) {
          conflictsFound = true;
          break;
        }
      }
      setHasConflicts(conflictsFound);
    };
    checkConflicts();
    // Re-check periodically and when week type or meetings change
    const interval = setInterval(checkConflicts, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekType, meetings]); // Re-check when week type or meetings change

  // Reorder views: categories (Today), weekly, teams, monthly, conflicts
  const availableViews: ViewType[] = ['categories', 'weekly', 'teams'];
  if (settings.monthlyViewEnabled) {
    availableViews.push('monthly');
  }
  availableViews.push('conflicts');

  const getViewLabel = (view: ViewType): string => {
    if (view === 'categories') return 'Today';
    return view.charAt(0).toUpperCase() + view.slice(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">View:</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-1 sm:flex-initial overflow-x-auto">
              {availableViews.map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative ${
                    currentView === view
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getViewLabel(view)}
                  {view === 'conflicts' && hasConflicts && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" title="Conflicts detected">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Only show Week selector for Weekly or Teams views */}
          {(currentView === 'weekly' || currentView === 'teams') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">Week:</span>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['A', 'B'] as WeekTypeFilter[]).map((week) => (
                  <button
                    key={week}
                    onClick={() => setCurrentWeekType(week)}
                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
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
          )}
        </div>
      </div>
    </div>
  );
}

