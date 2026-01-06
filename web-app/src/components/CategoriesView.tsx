import { useStore } from '../store/useStore';
import { Meeting } from '../types';
import MeetingCard from './MeetingCard';

interface CategoriesViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function CategoriesView({ onMeetingClick }: CategoriesViewProps) {
  const { categories, meetings } = useStore();

  const getMeetingsForCategory = (categoryId: string) => {
    return meetings.filter(m => m.categoryId === categoryId);
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryMeetings = getMeetingsForCategory(category.id);
        if (categoryMeetings.length === 0) return null;

        const color = `#${category.colorValue.toString(16).padStart(6, '0')}`;

        return (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3
              className="font-semibold text-lg mb-4 pb-2 border-b"
              style={{ borderBottomColor: color, color }}
            >
              {category.name}
            </h3>
            <div className="space-y-2">
              {categoryMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onClick={() => onMeetingClick(meeting)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

