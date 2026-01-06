import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Category, MeetingSeries, WeekType, CalendarSyncConfig, CalendarProvider } from '../types';
import { syncCalendar, getGoogleAuthUrl, getOutlookAuthUrl } from '../services/calendarSync';
import { getAvailableTimezones, getTimezoneDisplayName, getCurrentTimezone, timeToInputFormat, inputFormatToTime } from '../utils/timeUtils';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const {
    categories,
    settings,
    setMonthlyViewEnabled,
    setTimezone,
    setTimeFormat,
    saveCategory,
    deleteCategory,
    getMeetingSeries,
    updateMeetingSeries,
    deleteMeetingSeries,
    getCategory,
    getSyncConfigs,
    saveSyncConfig,
    deleteSyncConfig,
    saveMeeting,
    getNextMeetingId,
  } = useStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4287f5');
  const [meetingSeries, setMeetingSeries] = useState<MeetingSeries[]>([]);
  const [editingSeries, setEditingSeries] = useState<MeetingSeries | null>(null);
  const [seriesFormData, setSeriesFormData] = useState<Partial<MeetingSeries>>({});
  const [seriesStartTimeInput, setSeriesStartTimeInput] = useState('');
  const [seriesEndTimeInput, setSeriesEndTimeInput] = useState('');
  const [syncConfigs, setSyncConfigs] = useState<CalendarSyncConfig[]>([]);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [syncFormData, setSyncFormData] = useState<Partial<CalendarSyncConfig>>({});
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
    
    saveCategory({
      id,
      name: newCategoryName.trim(),
      colorValue,
    });
    
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(`#${category.colorValue.toString(16).padStart(6, '0')}`);
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
    saveCategory({
      ...editingCategory,
      name: newCategoryName.trim(),
      colorValue,
    });
    
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? Meetings assigned to this team will need to be updated or reassigned.')) {
      return;
    }
    await deleteCategory(id);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  // Load meeting series
  useEffect(() => {
    const loadSeries = async () => {
      const series = await getMeetingSeries();
      setMeetingSeries(series);
    };
    loadSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  const handleEditSeries = (series: MeetingSeries) => {
    setEditingSeries(series);
    setSeriesFormData({
      name: series.name,
      categoryId: series.categoryId,
      startTime: series.startTime,
      endTime: series.endTime,
      weekType: series.weekType,
      requiresAttendance: series.requiresAttendance,
      notes: series.notes,
      assignedTo: series.assignedTo,
    });
    setSeriesStartTimeInput(timeToInputFormat(series.startTime));
    setSeriesEndTimeInput(timeToInputFormat(series.endTime));
  };

  const handleSaveSeries = async () => {
    if (!editingSeries) return;
    const updates = {
      ...seriesFormData,
      startTime: inputFormatToTime(seriesStartTimeInput, settings.timeFormat),
      endTime: inputFormatToTime(seriesEndTimeInput, settings.timeFormat),
    };
    await updateMeetingSeries(editingSeries.seriesId, updates);
    setEditingSeries(null);
    setSeriesFormData({});
    setSeriesStartTimeInput('');
    setSeriesEndTimeInput('');
    // Reload series
    const series = await getMeetingSeries();
    setMeetingSeries(series);
  };

  const handleDeleteSeries = async (seriesId: string) => {
    const series = meetingSeries.find(s => s.seriesId === seriesId);
    if (!series) return;
    
    if (!confirm(`Are you sure you want to delete the entire "${series.name}" series? This will delete ${series.meetingIds.length} meeting(s).`)) {
      return;
    }
    
    await deleteMeetingSeries(seriesId);
    // Reload series
    const updatedSeries = await getMeetingSeries();
    setMeetingSeries(updatedSeries);
  };

  const handleCancelSeriesEdit = () => {
    setEditingSeries(null);
    setSeriesFormData({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl sm:text-3xl flex-shrink-0 ml-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-8">
            {/* Monthly View Toggle */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                View Options
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Monthly View</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Enable monthly calendar view
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.monthlyViewEnabled}
                    onChange={(e) => setMonthlyViewEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </section>

            {/* Time Settings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Time Settings
              </h3>
              
              {/* Time Format */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Time Format</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Choose between 12-hour and 24-hour time display
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      settings.timeFormat === '12h'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    12 Hour (1:00 PM)
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      settings.timeFormat === '24h'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    24 Hour (13:00)
                  </button>
                </div>
              </div>

              {/* Timezone Override */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Timezone</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Override your local timezone for displaying times
                  </div>
                </div>
                <div className="mt-3">
                  <select
                    value={settings.timezone || getCurrentTimezone()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTimezone(value === getCurrentTimezone() ? undefined : value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value={getCurrentTimezone()}>
                      System Default ({getCurrentTimezone()})
                    </option>
                    {getAvailableTimezones().map((tz) => (
                      <option key={tz} value={tz}>
                        {getTimezoneDisplayName(tz)}
                      </option>
                    ))}
                  </select>
                  {settings.timezone && (
                    <button
                      onClick={() => setTimezone(undefined)}
                      className="mt-2 text-sm text-primary hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Reset to system default
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Teams Management */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Teams
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage teams that appear in the Teams view. Each team has its own calendar and color coding.
              </p>

              {/* Add/Edit Team Form */}
              <div className="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter team name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Team Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="#4287f5"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    {editingCategory ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleSaveCategory}
                          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                        >
                          Save Team
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddCategory}
                        className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                      >
                        Add Team
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams List */}
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400">
                    No teams yet. Add your first team above.
                  </div>
                ) : (
                  categories.map((category) => {
                    const color = `#${category.colorValue.toString(16).padStart(6, '0')}`;
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {category.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {category.id}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Meeting Series Management */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Meeting Series
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage recurring meeting series. Edit or delete all meetings in a series at once.
              </p>

              {meetingSeries.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 text-sm">
                  No meeting series found. Series are automatically detected from meetings with the same name, time, and category.
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingSeries.map((series) => {
                    const category = getCategory(series.categoryId);
                    const color = category ? `#${category.colorValue.toString(16).padStart(6, '0')}` : '#6c757d';
                    const isEditing = editingSeries?.seriesId === series.seriesId;

                    return (
                      <div
                        key={series.seriesId}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={seriesFormData.name || ''}
                                  onChange={(e) => setSeriesFormData({ ...seriesFormData, name: e.target.value })}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Category
                                </label>
                                <select
                                  value={seriesFormData.categoryId || ''}
                                  onChange={(e) => setSeriesFormData({ ...seriesFormData, categoryId: e.target.value })}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={seriesStartTimeInput}
                                  onChange={(e) => {
                                    setSeriesStartTimeInput(e.target.value);
                                    setSeriesFormData({
                                      ...seriesFormData,
                                      startTime: inputFormatToTime(e.target.value, settings.timeFormat),
                                    });
                                  }}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={seriesEndTimeInput}
                                  onChange={(e) => {
                                    setSeriesEndTimeInput(e.target.value);
                                    setSeriesFormData({
                                      ...seriesFormData,
                                      endTime: inputFormatToTime(e.target.value, settings.timeFormat),
                                    });
                                  }}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Required Attendance
                                </label>
                                <input
                                  type="text"
                                  value={seriesFormData.requiresAttendance || ''}
                                  onChange={(e) => setSeriesFormData({ ...seriesFormData, requiresAttendance: e.target.value })}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Week Type
                                </label>
                                <select
                                  value={seriesFormData.weekType || WeekType.Both}
                                  onChange={(e) => setSeriesFormData({ ...seriesFormData, weekType: e.target.value as WeekType })}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                  <option value={WeekType.Both}>Both Weeks</option>
                                  <option value={WeekType.A}>Week A</option>
                                  <option value={WeekType.B}>Week B</option>
                                  <option value={WeekType.Monthly}>Monthly</option>
                                  <option value={WeekType.Quarterly}>Quarterly</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Notes
                                </label>
                                <input
                                  type="text"
                                  value={seriesFormData.notes || ''}
                                  onChange={(e) => setSeriesFormData({ ...seriesFormData, notes: e.target.value })}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <button
                                onClick={handleSaveSeries}
                                className="flex-1 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm sm:text-base"
                              >
                                Save All Meetings in Series
                              </button>
                              <button
                                onClick={handleCancelSeriesEdit}
                                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm sm:text-base"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div
                                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                                    {series.name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {series.startTime} - {series.endTime} • {series.meetingIds.length} meeting{series.meetingIds.length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Days: {series.days.join(', ')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-2">
                                <button
                                  onClick={() => handleEditSeries(series)}
                                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSeries(series.seriesId)}
                                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Calendar Sync */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Calendar Sync
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sync meetings from external calendar applications. One-way sync imports events from your external calendars.
              </p>

              {!showSyncForm ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSyncForm(true)}
                    className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    + Add Calendar Sync
                  </button>

                  {syncConfigs.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 text-sm">
                      No calendar syncs configured. Add one to import meetings from external calendars.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {syncConfigs.map((config) => (
                        <div
                          key={`${config.provider}-${config.name}`}
                          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {config.name}
                              </div>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                                {config.provider === 'google' ? 'Google Calendar' :
                                 config.provider === 'outlook' ? 'Outlook' :
                                 config.provider === 'ical' ? 'iCal' : 'Apple Calendar'}
                              </span>
                              {config.enabled && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                  Enabled
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setSyncing(`${config.provider}-${config.name}`);
                                  const result = await syncCalendar(config);
                                  if (result.success) {
                                    // Import meetings
                                    for (const meeting of result.meetings) {
                                      const newId = await getNextMeetingId();
                                      await saveMeeting({ ...meeting, id: newId });
                                    }
                                    alert(`Synced ${result.meetings.length} meetings`);
                                    // Reload configs
                                    const configs = await getSyncConfigs();
                                    setSyncConfigs(configs);
                                  } else {
                                    alert(`Sync failed: ${result.error}`);
                                  }
                                  setSyncing(null);
                                }}
                                disabled={syncing !== null || !config.enabled}
                                className="px-3 py-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                              >
                                {syncing === `${config.provider}-${config.name}` ? 'Syncing...' : 'Sync Now'}
                              </button>
                              <button
                                onClick={async () => {
                                  const configId = `${config.provider}-${config.name}`;
                                  await deleteSyncConfig(configId);
                                  const configs = await getSyncConfigs();
                                  setSyncConfigs(configs);
                                }}
                                className="px-3 py-1 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {config.lastSync && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Last synced: {new Date(config.lastSync).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Calendar Provider
                    </label>
                    <select
                      value={selectedProvider || ''}
                      onChange={(e) => {
                        setSelectedProvider(e.target.value as CalendarProvider);
                        setSyncFormData({ provider: e.target.value as CalendarProvider });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a provider</option>
                      <option value="google">Google Calendar</option>
                      <option value="outlook">Outlook / Microsoft 365</option>
                      <option value="ical">iCal / ICS File</option>
                      <option value="apple">Apple Calendar (ICS URL)</option>
                    </select>
                  </div>

                  {selectedProvider && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sync Name
                        </label>
                        <input
                          type="text"
                          value={syncFormData.name || ''}
                          onChange={(e) => setSyncFormData({ ...syncFormData, name: e.target.value })}
                          placeholder="e.g., Work Calendar"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      {selectedProvider === 'google' && (
                        <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            To sync with Google Calendar, you'll need to:
                          </p>
                          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Create a Google Cloud project and enable Calendar API</li>
                            <li>Create OAuth 2.0 credentials</li>
                            <li>Add redirect URI: {window.location.origin}/oauth/callback</li>
                            <li>Enter your Client ID and Client Secret below</li>
                          </ol>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Client ID
                            </label>
                            <input
                              type="text"
                              value={syncFormData.googleClientId || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, googleClientId: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={syncFormData.googleClientSecret || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, googleClientSecret: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Calendar ID (usually your email)
                            </label>
                            <input
                              type="text"
                              value={syncFormData.googleCalendarId || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, googleCalendarId: e.target.value })}
                              placeholder="your.email@gmail.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              if (!syncFormData.googleClientId || !syncFormData.googleCalendarId) {
                                alert('Please enter Client ID and Calendar ID');
                                return;
                              }
                              const redirectUri = `${window.location.origin}/oauth/callback`;
                              const authUrl = getGoogleAuthUrl(syncFormData.googleClientId!, redirectUri);
                              // Store config temporarily
                              sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                ...syncFormData,
                                provider: 'google',
                                name: syncFormData.name || 'Google Calendar',
                              }));
                              window.location.href = authUrl;
                            }}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Connect Google Calendar
                          </button>
                        </div>
                      )}

                      {selectedProvider === 'outlook' && (
                        <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            To sync with Outlook, you'll need to:
                          </p>
                          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Register an app in Azure Portal</li>
                            <li>Add redirect URI: {window.location.origin}/oauth/callback</li>
                            <li>Enter your Client ID and Client Secret below</li>
                          </ol>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Client ID
                            </label>
                            <input
                              type="text"
                              value={syncFormData.outlookClientId || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, outlookClientId: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={syncFormData.outlookClientSecret || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, outlookClientSecret: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              if (!syncFormData.outlookClientId) {
                                alert('Please enter Client ID');
                                return;
                              }
                              const redirectUri = `${window.location.origin}/oauth/callback`;
                              const authUrl = getOutlookAuthUrl(syncFormData.outlookClientId!, redirectUri);
                              sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                ...syncFormData,
                                provider: 'outlook',
                                name: syncFormData.name || 'Outlook Calendar',
                              }));
                              window.location.href = authUrl;
                            }}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Connect Outlook
                          </button>
                        </div>
                      )}

                      {(selectedProvider === 'ical' || selectedProvider === 'apple') && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              ICS File URL
                            </label>
                            <input
                              type="url"
                              value={syncFormData.icsUrl || ''}
                              onChange={(e) => setSyncFormData({ ...syncFormData, icsUrl: e.target.value })}
                              placeholder="https://example.com/calendar.ics"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Enter the public URL of your ICS calendar file
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!syncFormData.name || !syncFormData.icsUrl) {
                                alert('Please enter a name and ICS URL');
                                return;
                              }
                              const config: CalendarSyncConfig & { id: string } = {
                                id: `${selectedProvider}-${syncFormData.name}`,
                                provider: selectedProvider,
                                name: syncFormData.name,
                                enabled: true,
                                icsUrl: syncFormData.icsUrl,
                              };
                              await saveSyncConfig(config);
                              const configs = await getSyncConfigs();
                              setSyncConfigs(configs);
                              setShowSyncForm(false);
                              setSelectedProvider(null);
                              setSyncFormData({});
                            }}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Save ICS Sync
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowSyncForm(false);
                            setSelectedProvider(null);
                            setSyncFormData({});
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

