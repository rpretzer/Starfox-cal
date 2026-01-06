import { useEffect, useState } from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { useStore } from '../store/useStore';
import MeetingCard from './MeetingCard';
import { Meeting } from '../types';

interface TeamCalendarProps {
  categoryId: string;
  onMeetingClick: (meeting: Meeting) => void;
}

// Team-specific DayColumn that filters by category
function TeamDayColumn({ day, categoryId, onMeetingClick }: { day: string; categoryId: string; onMeetingClick: (meeting: Meeting) => void }) {
  const { getMeetingsForDay, currentWeekType, moveMeetingToDay, meetings } = useStore();
  const [dayMeetings, setDayMeetings] = useState<Meeting[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = async () => {
      const result = await getMeetingsForDay(day);
      // Filter by category
      const filtered = result.filter(m => m.categoryId === categoryId);
      if (!cancelled) {
        setDayMeetings(filtered);
      }
    };
    loadMeetings();
    return () => {
      cancelled = true;
    };
  }, [day, currentWeekType, categoryId, meetings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const meetingId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(meetingId)) return;

    const meeting = dayMeetings.find(m => m.id === meetingId);
    if (meeting && meeting.days.includes(day)) {
      return;
    }

    await moveMeetingToDay(meetingId, day);
  };

  return (
    <div
      className={`w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-3 flex flex-col min-h-0 transition-colors ${
        isDragOver
          ? 'border-primary bg-blue-50 dark:bg-blue-900/20 border-dashed'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center text-sm">
        {day.substring(0, 3)}
      </h3>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {dayMeetings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">
            {isDragOver ? 'Drop here' : 'No meetings'}
          </p>
        ) : (
          dayMeetings.map((meeting) => (
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

export default function TeamCalendar({ categoryId, onMeetingClick }: TeamCalendarProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <TeamDayColumn
            key={day}
            day={day}
            categoryId={categoryId}
            onMeetingClick={onMeetingClick}
          />
        ))}
      </div>
    </div>
  );
}
