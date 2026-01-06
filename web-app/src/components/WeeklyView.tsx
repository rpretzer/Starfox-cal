import { DAYS_OF_WEEK } from '../constants';
import DayColumn from './DayColumn';
import { Meeting } from '../types';

interface WeeklyViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function WeeklyView({ onMeetingClick }: WeeklyViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max">
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

