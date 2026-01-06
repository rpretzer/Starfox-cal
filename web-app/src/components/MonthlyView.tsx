import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Meeting } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { formatTime } from '../utils/timeUtils';

interface MonthlyViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Days of week in JavaScript Date.getDay() order (0=Sunday, 1=Monday, etc.)
const FULL_DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyView({ onMeetingClick }: MonthlyViewProps) {
  const { meetings, getCategory, settings } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add previous month's trailing days
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust for Monday start
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: dateOnly.getTime() === today.getTime(),
      });
    }
    
    // Add next month's leading days to fill the grid (6 rows = 42 days)
    const totalDays = days.length;
    const remainingDays = 42 - totalDays;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  }, [currentDate]);

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date): Meeting[] => {
    const dayName = FULL_DAYS_OF_WEEK[date.getDay()];
    const dayNameShort = dayName.substring(0, 3); // Mon, Tue, etc.
    
    // Check if this day matches any meeting's days
    return meetings.filter(meeting => {
      // Check if meeting occurs on this day of week
      const matchesDay = meeting.days.some(meetingDay => {
        const meetingDayShort = meetingDay.substring(0, 3);
        return dayNameShort === meetingDayShort || meetingDay === dayName;
      });
      
      if (!matchesDay) return false;
      
      // For monthly view, show all meetings regardless of week type
      // But we could filter by week type if needed
      return true;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {monthName} {year}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs sm:text-sm bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Day Headers - Reorder to start with Monday to match grid offset */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[...FULL_DAYS_OF_WEEK.slice(1), FULL_DAYS_OF_WEEK[0]].map((day) => {
            // Show only Monday-Friday in header, but keep 7 columns
            const isWorkDay = DAYS_OF_WEEK.some(d => d.startsWith(day.substring(0, 3)));
            return (
              <div
                key={day}
                className={`p-2 text-center text-xs sm:text-sm font-semibold ${
                  isWorkDay
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {day.substring(0, 3)}
              </div>
            );
          })}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calendarDay, idx) => {
            const meetings = calendarDay.isCurrentMonth ? getMeetingsForDate(calendarDay.date) : [];
            const isWorkDay = DAYS_OF_WEEK.some(d => {
              const dayName = FULL_DAYS_OF_WEEK[calendarDay.date.getDay()];
              return d.startsWith(dayName.substring(0, 3));
            });

            return (
              <div
                key={`${calendarDay.date.getTime()}-${calendarDay.dayOfMonth}-${idx}`}
                className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-1 sm:p-2 ${
                  !calendarDay.isCurrentMonth
                    ? 'bg-gray-50 dark:bg-gray-900/50'
                    : isWorkDay
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-900/30'
                } ${calendarDay.isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
              >
                <div
                  className={`text-xs sm:text-sm font-medium mb-1 ${
                    calendarDay.isToday
                      ? 'text-primary font-bold'
                      : calendarDay.isCurrentMonth
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {calendarDay.dayOfMonth}
                </div>
                <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] lg:max-h-[100px]">
                  {meetings.slice(0, 3).map((meeting) => {
                    const category = getCategory(meeting.categoryId);
                    const color = category ? `#${category.colorValue.toString(16).padStart(6, '0')}` : '#6c757d';
                    return (
                      <div
                        key={meeting.id}
                        onClick={() => onMeetingClick(meeting)}
                        className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate border-l-2"
                        style={{ borderLeftColor: color }}
                        title={`${meeting.name} (${formatTime(meeting.startTime, settings.timeFormat)} - ${formatTime(meeting.endTime, settings.timeFormat)})`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {meeting.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 truncate">
                          {formatTime(meeting.startTime, settings.timeFormat)}
                        </div>
                      </div>
                    );
                  })}
                  {meetings.length > 3 && (
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium p-0.5 sm:p-1">
                      +{meetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

