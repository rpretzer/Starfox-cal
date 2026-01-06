import { useState } from 'react';
import { useStore } from '../store/useStore';
import CalendarHeader from './CalendarHeader';
import WeeklyView from './WeeklyView';
import ConflictsView from './ConflictsView';
import CategoriesView from './CategoriesView';
import MeetingDetailModal from './MeetingDetailModal';
import SettingsScreen from './SettingsScreen';
import { Meeting } from '../types';

export default function CalendarScreen() {
  const { currentView, getNextMeetingId } = useStore();
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const handleAddMeeting = async () => {
    const newId = await getNextMeetingId();
    setEditingMeeting({
      id: newId,
      name: '',
      categoryId: '',
      days: [],
      startTime: '',
      endTime: '',
      weekType: 'both' as any,
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

  const handleCloseModal = () => {
    setIsMeetingModalOpen(false);
    setEditingMeeting(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'weekly':
        return <WeeklyView onMeetingClick={handleEditMeeting} />;
      case 'conflicts':
        return <ConflictsView onMeetingClick={handleEditMeeting} />;
      case 'categories':
        return <CategoriesView onMeetingClick={handleEditMeeting} />;
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sprint Calendar</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddMeeting}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                <span>Add Meeting</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CalendarHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-hidden">
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

