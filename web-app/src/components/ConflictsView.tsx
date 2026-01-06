import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { DAYS_OF_WEEK } from '../constants';
import { Meeting } from '../types';

interface Conflict {
  day: string;
  time: string;
  meetings: number[];
}

interface ConflictsViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function ConflictsView({ onMeetingClick }: ConflictsViewProps) {
  const { getConflictsForDay, getMeeting, meetings, currentWeekType } = useStore();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConflicts = async () => {
      setIsLoading(true);
      try {
        const allConflicts: Conflict[] = [];
        for (const day of DAYS_OF_WEEK) {
          const dayConflicts = await getConflictsForDay(day);
          allConflicts.push(...dayConflicts);
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
  }, [getConflictsForDay, meetings, currentWeekType]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading conflicts...</p>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No meetings found
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          Add meetings to your calendar to detect conflicts.
        </p>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 dark:text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No conflicts detected
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          Great! All your meetings are scheduled without conflicts in the current week view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
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
              Conflict Detected: {conflict.day} at {conflict.time}
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

