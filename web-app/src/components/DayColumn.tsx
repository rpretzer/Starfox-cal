import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import MeetingCard from './MeetingCard';
import { Meeting } from '../types';

interface DayColumnProps {
  day: string;
  onMeetingClick: (meeting: Meeting) => void;
}

export default function DayColumn({ day, onMeetingClick }: DayColumnProps) {
  const { getMeetingsForDay, currentWeekType } = useStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMeetingsForDay(day).then((result) => {
      if (!cancelled) {
        setMeetings(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [day, currentWeekType]); // Removed getMeetingsForDay from deps - Zustand functions are stable

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col min-h-0">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
        {day}
      </h3>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {meetings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No meetings</p>
        ) : (
          meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onClick={() => onMeetingClick(meeting)}
            />
          ))
        )}
      </div>
    </div>
  );
}

