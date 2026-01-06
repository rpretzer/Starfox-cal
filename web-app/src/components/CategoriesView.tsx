import { useStore } from '../store/useStore';
import { Meeting } from '../types';
import MeetingCard from './MeetingCard';
import ConflictsContainer from './ConflictsContainer';

interface CategoriesViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function CategoriesView({ onMeetingClick }: CategoriesViewProps) {
  const { categories, meetings } = useStore();

  const getMeetingsForCategory = (categoryId: string) => {
    return meetings.filter(m => m.categoryId === categoryId);
  };

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No categories yet
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          Go to Settings to add categories and organize your meetings.
        </p>
      </div>
    );
  }

  // Show empty state if no meetings
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No meetings found
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          Click "+ Add Meeting" to create your first meeting.
        </p>
      </div>
    );
  }

  // Filter categories that have meetings
  const categoriesWithMeetings = categories.filter(category => {
    const categoryMeetings = getMeetingsForCategory(category.id);
    return categoryMeetings.length > 0;
  });

  // Show message if categories exist but none have meetings
  if (categoriesWithMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No meetings in categories
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          You have categories set up, but no meetings assigned to them yet. Click "+ Add Meeting" to create meetings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ConflictsContainer onMeetingClick={onMeetingClick} />
      {categoriesWithMeetings.map((category) => {
        const categoryMeetings = getMeetingsForCategory(category.id);
        const color = `#${category.colorValue.toString(16).padStart(6, '0')}`;

        return (
          <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <h3
              className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 pb-2 border-b dark:border-gray-700"
              style={{ borderBottomColor: color, color }}
            >
              {category.name}
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
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

