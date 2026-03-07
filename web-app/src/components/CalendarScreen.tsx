import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import CalendarHeader from './CalendarHeader';
import WeeklyView from './WeeklyView';
import CategoriesView from './CategoriesView';
import MonthlyView from './MonthlyView';
import TeamsView from './TeamsView';
import MeetingDetailModal from './MeetingDetailModal';
import SettingsScreen from './SettingsScreen';
import type { Meeting, ViewType, WeekTypeFilter } from '../types';
import { WeekType } from '../types';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!isOffline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-200"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
      </svg>
      You're offline — changes will sync when you reconnect
    </div>
  );
}

export default function CalendarScreen() {
  const { currentView, getNextMeetingId, setCurrentView, setCurrentWeekType } = useStore();
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Handle URL parameters for permalinks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ViewType | null;
    const weekParam = params.get('week') as WeekTypeFilter | null;
    const meetingIdParam = params.get('meeting');

    if (viewParam && ['weekly', 'categories', 'monthly', 'teams'].includes(viewParam)) {
      setCurrentView(viewParam);
    }
    if (weekParam && (weekParam === 'A' || weekParam === 'B')) {
      setCurrentWeekType(weekParam);
    }
    if (meetingIdParam) {
      const meetingId = parseInt(meetingIdParam, 10);
      if (!isNaN(meetingId)) {
        // Find and open the meeting
        const store = useStore.getState();
        const meeting = store.getMeeting(meetingId);
        if (meeting) {
          setEditingMeeting(meeting);
          setIsMeetingModalOpen(true);
        }
      }
    }
  }, [setCurrentView, setCurrentWeekType]);

  const handleAddMeeting = async () => {
    const newId = await getNextMeetingId();
    setEditingMeeting({
      id: newId,
      name: '',
      categoryId: '',
      days: [],
      startTime: '',
      endTime: '',
      weekType: WeekType.Both,
      requiresAttendance: '',
      notes: '',
      assignedTo: '',
    });
    setIsMeetingModalOpen(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsMeetingModalOpen(true);
  };

  const handleCreateMeetingWithDefaults = async (day: string, categoryId: string) => {
    const newId = await getNextMeetingId();
    setEditingMeeting({
      id: newId,
      name: '',
      categoryId,
      days: [day],
      startTime: '',
      endTime: '',
      weekType: WeekType.Both,
      requiresAttendance: '',
      notes: '',
      assignedTo: '',
    });
    setIsMeetingModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsMeetingModalOpen(false);
    setEditingMeeting(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'weekly':
        return <WeeklyView onMeetingClick={handleEditMeeting} />;
      case 'categories':
        return <CategoriesView onMeetingClick={handleEditMeeting} />;
      case 'monthly':
        return <MonthlyView onMeetingClick={handleEditMeeting} />;
      case 'teams':
        return <TeamsView onMeetingClick={handleEditMeeting} onCreateMeeting={handleCreateMeetingWithDefaults} />;
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineBanner />
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate pr-2">
              Sprint Calendar
            </h1>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <a
                href="https://github.com/rpretzer/Starfox-cal"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <button
                onClick={handleAddMeeting}
                aria-label="Add meeting"
                className="bg-primary text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <span aria-hidden="true" className="text-lg sm:text-xl">+</span>
                <span className="hidden sm:inline" aria-hidden="true">Add Meeting</span>
                <span className="sm:hidden" aria-hidden="true">Add</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CalendarHeader />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 w-full overflow-hidden">
        {renderView()}
      </div>

      {isMeetingModalOpen && editingMeeting && (
        <MeetingDetailModal
          meeting={editingMeeting}
          onClose={handleCloseModal}
        />
      )}

      {isSettingsOpen && (
        <SettingsScreen onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

