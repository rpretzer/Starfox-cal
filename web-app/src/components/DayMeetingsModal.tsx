import { Meeting } from '../types';
import { formatTime } from '../utils/timeUtils';
import { useStore } from '../store/useStore';

interface DayMeetingsModalProps {
  date: Date;
  meetings: Meeting[];
  onClose: () => void;
  onMeetingClick: (meeting: Meeting) => void;
}

export default function DayMeetingsModal({ date, meetings, onClose, onMeetingClick }: DayMeetingsModalProps) {
  const { settings, getCategory } = useStore();
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {dayName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {dateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Meetings List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {meetings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No meetings scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings
                .sort((a, b) => {
                  // Sort by start time
                  const timeA = formatTime(a.startTime, settings.timeFormat);
                  const timeB = formatTime(b.startTime, settings.timeFormat);
                  return timeA.localeCompare(timeB);
                })
                .map((meeting) => {
                  const category = getCategory(meeting.categoryId);
                  return (
                    <div
                      key={meeting.id}
                      onClick={() => {
                        onMeetingClick(meeting);
                        onClose();
                      }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                              {meeting.name}
                            </h3>
                            {category && (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: `#${category.colorValue.toString(16).padStart(6, '0')}20`,
                                  color: `#${category.colorValue.toString(16).padStart(6, '0')}`,
                                }}
                              >
                                {category.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(meeting.startTime, settings.timeFormat)} - {formatTime(meeting.endTime, settings.timeFormat)}
                          </p>
                          {meeting.requiresAttendance && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {meeting.requiresAttendance}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

