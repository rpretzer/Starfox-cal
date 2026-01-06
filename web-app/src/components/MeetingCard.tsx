import { useStore } from '../store/useStore';
import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export default function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const { getCategory } = useStore();
  const category = getCategory(meeting.categoryId);
  const color = category ? `#${category.colorValue.toString(16).padStart(6, '0')}` : '#6c757d';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-700 border-l-4 rounded p-3 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow cursor-pointer"
      style={{ borderLeftColor: color }}
    >
      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{meeting.name}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        {meeting.startTime} - {meeting.endTime}
      </div>
      {category && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {category.name}
        </div>
      )}
    </div>
  );
}

