import { useState } from 'react';
import { useStore } from '../store/useStore';
import CalendarHeader from './CalendarHeader';
import WeeklyView from './WeeklyView';
import ConflictsView from './ConflictsView';
import CategoriesView from './CategoriesView';
import MeetingDetailModal from './MeetingDetailModal';
import { Meeting } from '../types';

export default function CalendarScreen() {
  const { currentView, getNextMeetingId } = useStore();
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Sprint Calendar</h1>
            <button
              onClick={handleAddMeeting}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Meeting</span>
            </button>
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
    </div>
  );
}

