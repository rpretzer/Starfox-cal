import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import MeetingCard from './MeetingCard';
import { Meeting } from '../types';

interface DayColumnProps {
  day: string;
  onMeetingClick: (meeting: Meeting) => void;
}

export default function DayColumn({ day, onMeetingClick }: DayColumnProps) {
  const { getMeetingsForDay, currentWeekType, moveMeetingToDay, meetings } = useStore();
  const [dayMeetings, setDayMeetings] = useState<Meeting[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = async () => {
      const result = await getMeetingsForDay(day);
      if (!cancelled) {
        setDayMeetings(result);
      }
    };
    loadMeetings();
    return () => {
      cancelled = true;
    };
  }, [day, currentWeekType, meetings]); // Refresh when day, week type, or meetings change

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

    // Check if meeting is already on this day
    const meeting = dayMeetings.find(m => m.id === meetingId);
    if (meeting && meeting.days.includes(day)) {
      return; // Already on this day
    }

    // Move the meeting to this day
    // This will trigger refreshMeetings() which updates the meetings array
    // The useEffect will then refresh this column's meetings
    await moveMeetingToDay(meetingId, day);
  };

  return (
    <div
      className={`w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-4 flex flex-col min-h-0 transition-colors ${
        isDragOver
          ? 'border-primary bg-blue-50 dark:bg-blue-900/20 border-dashed'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
        {day}
      </h3>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {dayMeetings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
            {isDragOver ? 'Drop meeting here' : 'No meetings'}
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

