import { Meeting } from '../types';

interface MonthlyViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function MonthlyView({ onMeetingClick }: MonthlyViewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Monthly View
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Monthly calendar view is coming soon. This will show a full month calendar with all meetings.
      </p>
    </div>
  );
}

