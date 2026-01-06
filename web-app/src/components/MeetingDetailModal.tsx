import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Meeting, WeekType } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { timeToInputFormat, inputFormatToTime } from '../utils/timeUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';
import { shareMeeting, copyToClipboard, generateMeetingPermalink } from '../utils/shareUtils';

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
  
  // Check if this is a synced meeting
  const isSyncedMeeting = !!meeting.syncSource;

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
      // For synced meetings, preserve original time/date fields
      const meetingToSave = isSyncedMeeting
        ? {
            ...meeting, // Start with original meeting to preserve read-only fields
            notes: formData.notes, // Allow notes to be edited
            meetingLink: formData.meetingLink, // Allow meeting link to be edited
            meetingLinkType: formData.meetingLinkType, // Allow meeting link type to be edited
            categoryId: formData.categoryId, // Allow category to be changed
            requiresAttendance: formData.requiresAttendance, // Allow required attendance to be changed
            assignedTo: formData.assignedTo, // Allow assigned to be changed
          }
        : {
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
                disabled={isSyncedMeeting}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  isSyncedMeeting ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
              {isSyncedMeeting && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Name cannot be changed for synced meetings</p>
              )}
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
              <div className={`flex flex-wrap gap-2 ${isSyncedMeeting ? 'opacity-60' : ''}`}>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isSyncedMeeting && toggleDay(day)}
                    disabled={isSyncedMeeting}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.days.includes(day)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } ${isSyncedMeeting ? 'cursor-not-allowed' : ''}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {isSyncedMeeting && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days cannot be changed for synced meetings</p>
              )}
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
                    if (!isSyncedMeeting) {
                      setStartTimeInput(e.target.value);
                      setFormData({
                        ...formData,
                        startTime: inputFormatToTime(e.target.value, settings.timeFormat),
                      });
                    }
                  }}
                  disabled={isSyncedMeeting}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    isSyncedMeeting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
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
                    if (!isSyncedMeeting) {
                      setEndTimeInput(e.target.value);
                      setFormData({
                        ...formData,
                        endTime: inputFormatToTime(e.target.value, settings.timeFormat),
                      });
                    }
                  }}
                  disabled={isSyncedMeeting}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    isSyncedMeeting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
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
                placeholder={isSyncedMeeting ? "Add notes for this synced meeting..." : ""}
              />
            </div>

            {/* Imported Attendees - read-only for synced meetings */}
            {isSyncedMeeting && formData.importedAttendees && formData.importedAttendees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imported Attendees (from {formData.syncSource} calendar)
                </label>
                <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-wrap gap-2">
                    {formData.importedAttendees.map((attendee, idx) => (
                      <span
                        key={idx}
                        className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 px-2 py-1 rounded"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Attendees cannot be changed for synced meetings</p>
              </div>
            )}

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

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meeting Link (Zoom/Teams/Meet)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.meetingLinkType || 'other'}
                  onChange={(e) => setFormData({ ...formData, meetingLinkType: e.target.value as 'zoom' | 'teams' | 'meet' | 'other' })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="zoom">Zoom</option>
                  <option value="teams">Teams</option>
                  <option value="meet">Google Meet</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="url"
                  value={formData.meetingLink || ''}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Public Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Public Visibility
              </label>
              <select
                value={formData.publicVisibility || 'private'}
                onChange={(e) => setFormData({ ...formData, publicVisibility: e.target.value as 'private' | 'busy' | 'titles' | 'full' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="private">Private (not visible)</option>
                <option value="busy">Busy (time only)</option>
                <option value="titles">Titles Only</option>
                <option value="full">Full Details</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Controls what others can see when viewing your calendar
              </p>
            </div>

            {/* Share Section */}
            {meeting.id > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const permalink = formData.permalink || generateMeetingPermalink(meeting.id);
                        await shareMeeting(formData, permalink);
                        showToast('Meeting shared successfully', 'success');
                      } catch (error) {
                        if (error instanceof Error && error.message === 'Copied to clipboard') {
                          showToast('Meeting link copied to clipboard', 'success');
                        } else {
                          showToast(`Failed to share: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                        }
                      }
                    }}
                    className="flex-1 min-w-[120px] px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const permalink = formData.permalink || generateMeetingPermalink(meeting.id);
                        await copyToClipboard(permalink);
                        showToast('Permalink copied to clipboard', 'success');
                      } catch (error) {
                        showToast(`Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                      }
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                    title="Copy permalink"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Link
                  </button>
                  {formData.meetingLink && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await copyToClipboard(formData.meetingLink!);
                          showToast('Meeting link copied to clipboard', 'success');
                        } catch (error) {
                          showToast(`Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                      title="Copy meeting link"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {formData.meetingLinkType === 'zoom' ? 'Zoom' : formData.meetingLinkType === 'teams' ? 'Teams' : formData.meetingLinkType === 'meet' ? 'Meet' : 'Link'}
                    </button>
                  )}
                </div>
                {formData.permalink && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Permalink: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{formData.permalink}</code>
                  </div>
                )}
              </div>
            )}

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

