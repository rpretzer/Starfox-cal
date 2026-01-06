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
    getMeetingsForDay(day).then(setMeetings);
  }, [day, getMeetingsForDay, currentWeekType]);

  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-4 text-center sticky top-0 bg-white py-2">
        {day}
      </h3>
      <div className="space-y-2">
        {meetings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No meetings</p>
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

