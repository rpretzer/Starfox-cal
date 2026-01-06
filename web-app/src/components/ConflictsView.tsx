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
  const { getConflictsForDay, getMeeting } = useStore();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    const loadConflicts = async () => {
      const allConflicts: Conflict[] = [];
      for (const day of DAYS_OF_WEEK) {
        const dayConflicts = await getConflictsForDay(day);
        allConflicts.push(...dayConflicts);
      }
      setConflicts(allConflicts);
    };
    loadConflicts();
  }, [getConflictsForDay]);

  if (conflicts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No conflicts detected in the current week view.</p>
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

