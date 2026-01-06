import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ViewType, WeekTypeFilter } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { generateViewPermalink, copyToClipboard } from '../utils/shareUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';

export default function CalendarHeader() {
  const { currentView, currentWeekType, settings, setCurrentView, setCurrentWeekType, getConflictsForDay, meetings } = useStore();
  const { showToast } = useGlobalToast();
  const [conflictsByView, setConflictsByView] = useState<Record<string, boolean>>({});
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Check for conflicts per view
  useEffect(() => {
    const checkConflicts = async () => {
      const conflicts: Record<string, boolean> = {};
      
      // Get today's day name
      const today = new Date();
      const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = dayNames[dayIndex];
      
      // Check conflicts for Today view (only if today is a workday)
      if (DAYS_OF_WEEK.some(day => day.startsWith(todayDayName.substring(0, 3)))) {
        const todayConflicts = await getConflictsForDay(todayDayName);
        conflicts.categories = todayConflicts.length > 0;
      } else {
        conflicts.categories = false;
      }
      
      // Check conflicts for Weekly and Teams views (all days)
      let weeklyConflicts = false;
      for (const day of DAYS_OF_WEEK) {
        const dayConflicts = await getConflictsForDay(day);
        if (dayConflicts.length > 0) {
          weeklyConflicts = true;
          break;
        }
      }
      conflicts.weekly = weeklyConflicts;
      conflicts.teams = weeklyConflicts;
      
      // Monthly view never shows conflicts
      conflicts.monthly = false;
      
      setConflictsByView(conflicts);
    };
    checkConflicts();
    // Re-check periodically and when week type or meetings change
    const interval = setInterval(checkConflicts, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekType, meetings]); // Re-check when week type or meetings change

  // Reorder views: categories (Today), weekly, teams, monthly (no conflicts tab)
  const availableViews: ViewType[] = ['categories', 'weekly', 'teams'];
  if (settings.monthlyViewEnabled) {
    availableViews.push('monthly');
  }

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
                  {conflictsByView[view] && (
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

          {/* Share View Button */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full sm:w-auto px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm"
              title="Share current view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            {showShareMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowShareMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-2">
                    <button
                      onClick={async () => {
                        try {
                          const permalink = generateViewPermalink(currentView, currentWeekType);
                          await copyToClipboard(permalink);
                          showToast('View link copied to clipboard', 'success');
                          setShowShareMenu(false);
                        } catch (error) {
                          showToast(`Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy View Link
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

