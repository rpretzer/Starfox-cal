import { DAYS_OF_WEEK } from '../constants';
import DayColumn from './DayColumn';
import { Meeting } from '../types';

interface WeeklyViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function WeeklyView({ onMeetingClick }: WeeklyViewProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {DAYS_OF_WEEK.map((day) => (
          <DayColumn
            key={day}
            day={day}
            onMeetingClick={onMeetingClick}
          />
        ))}
      </div>
    </div>
  );
}

