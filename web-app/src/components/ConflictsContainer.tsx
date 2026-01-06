import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { DAYS_OF_WEEK } from '../constants';
import { Meeting } from '../types';

interface Conflict {
  day: string;
  time: string;
  meetings: number[];
}

interface ConflictsContainerProps {
  onMeetingClick: (meeting: Meeting) => void;
  filterDay?: string; // If provided, only show conflicts for this day (e.g., "Monday", "Tuesday")
}

export default function ConflictsContainer({ onMeetingClick, filterDay }: ConflictsContainerProps) {
  const { getConflictsForDay, getMeeting, meetings, currentWeekType } = useStore();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConflicts = async () => {
      setIsLoading(true);
      try {
        const allConflicts: Conflict[] = [];
        if (filterDay) {
          // Only load conflicts for the specified day
          const dayConflicts = await getConflictsForDay(filterDay);
          allConflicts.push(...dayConflicts);
        } else {
          // Load conflicts for all days
          for (const day of DAYS_OF_WEEK) {
            const dayConflicts = await getConflictsForDay(day);
            allConflicts.push(...dayConflicts);
          }
        }
        setConflicts(allConflicts);
      } catch (error) {
        console.error('Error loading conflicts:', error);
        setConflicts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadConflicts();
  }, [getConflictsForDay, meetings, currentWeekType, filterDay]);

  // Don't show if no conflicts
  if (isLoading || conflicts.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Meeting Conflicts ({conflicts.length})</span>
      </div>
      {conflicts.map((conflict, idx) => {
        const meeting1 = getMeeting(conflict.meetings[0]);
        const meeting2 = getMeeting(conflict.meetings[1]);
        
        if (!meeting1 || !meeting2) return null;

        return (
          <div
            key={idx}
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-lg p-3 sm:p-4"
          >
            <div className="font-semibold text-red-800 dark:text-red-300 mb-2 text-sm sm:text-base">
              Conflict: {conflict.day} at {conflict.time}
            </div>
            <div className="space-y-2">
              <div
                onClick={() => onMeetingClick(meeting1)}
                className="bg-white dark:bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm sm:text-base touch-manipulation"
              >
                {meeting1.name}
              </div>
              <div
                onClick={() => onMeetingClick(meeting2)}
                className="bg-white dark:bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm sm:text-base touch-manipulation"
              >
                {meeting2.name}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mt-2 italic">
              Recommendation: Rotate representatives or adjust timing
            </p>
          </div>
        );
      })}
    </div>
  );
}

