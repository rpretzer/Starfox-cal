import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Meeting, WeekType } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { timeToInputFormat, inputFormatToTime } from '../utils/timeUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
}

export default function MeetingDetailModal({ meeting, onClose }: MeetingDetailModalProps) {
  const { saveMeeting, deleteMeeting, categories, settings } = useStore();
  const { showToast } = useGlobalToast();
  const [formData, setFormData] = useState(meeting);
  const [isSaving, setIsSaving] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(timeToInputFormat(meeting.startTime));
  const [endTimeInput, setEndTimeInput] = useState(timeToInputFormat(meeting.endTime));

  useEffect(() => {
    setFormData(meeting);
    setStartTimeInput(timeToInputFormat(meeting.startTime));
    setEndTimeInput(timeToInputFormat(meeting.endTime));
  }, [meeting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Convert time inputs to display format
      const meetingToSave = {
        ...formData,
        startTime: inputFormatToTime(startTimeInput, settings.timeFormat),
        endTime: inputFormatToTime(endTimeInput, settings.timeFormat),
      };
      await saveMeeting(meetingToSave);
      const action = meeting.id > 0 ? 'updated' : 'created';
      showToast(`Meeting "${meetingToSave.name}" ${action} successfully`, 'success');
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      showToast(`Failed to save meeting: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      const meetingName = meeting.name;
      await deleteMeeting(meeting.id);
      showToast(`Meeting "${meetingName}" deleted successfully`, 'success');
      onClose();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      showToast(`Failed to delete meeting: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      days: formData.days.includes(day)
        ? formData.days.filter(d => d !== day)
        : [...formData.days, day],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {meeting.id > 0 ? 'Edit Meeting' : 'Add Meeting'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl sm:text-3xl flex-shrink-0 ml-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.days.includes(day)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={startTimeInput}
                  onChange={(e) => {
                    setStartTimeInput(e.target.value);
                    setFormData({
                      ...formData,
                      startTime: inputFormatToTime(e.target.value, settings.timeFormat),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={endTimeInput}
                  onChange={(e) => {
                    setEndTimeInput(e.target.value);
                    setFormData({
                      ...formData,
                      endTime: inputFormatToTime(e.target.value, settings.timeFormat),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency
              </label>
              <select
                value={formData.weekType}
                onChange={(e) => setFormData({ ...formData, weekType: e.target.value as WeekType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="both">Weekly</option>
                <option value="a">Biweekly (Week A)</option>
                <option value="b">Biweekly (Week B)</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Required Attendance *
              </label>
              <input
                type="text"
                required
                value={formData.requiresAttendance}
                onChange={(e) => setFormData({ ...formData, requiresAttendance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {meeting.id > 0 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

