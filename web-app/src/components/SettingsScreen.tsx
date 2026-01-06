import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Category, MeetingSeries, WeekType, CalendarSyncConfig, CalendarProvider, AppSettings } from '../types';
import { syncCalendar, getGoogleAuthUrl, getOutlookAuthUrl, getAppleAuthUrl } from '../services/calendarSync';
import { getAvailableTimezones, getTimezoneDisplayName, getCurrentTimezone, timeToInputFormat, inputFormatToTime } from '../utils/timeUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';

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
    setOAuthClientIds,
    setDefaultPublicVisibility,
    setPermalinkBaseUrl,
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<CalendarProvider | null>(null);
  const { showToast } = useGlobalToast();
  
  // Pending settings state
  const [pendingSettings, setPendingSettings] = useState<Partial<AppSettings>>({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'warning');
      return;
    }
    
    try {
      const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
      const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
      
      await saveCategory({
        id,
        name: newCategoryName.trim(),
        colorValue,
      });
      
      setNewCategoryName('');
      setNewCategoryColor('#4287f5');
      showToast(`Category "${newCategoryName.trim()}" added successfully`, 'success');
    } catch (error) {
      showToast(`Failed to add category: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(`#${category.colorValue.toString(16).padStart(6, '0')}`);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showToast('Please enter a category name', 'warning');
      return;
    }
    
    try {
      const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
      await saveCategory({
        ...editingCategory,
        name: newCategoryName.trim(),
        colorValue,
      });
      
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor('#4287f5');
      showToast(`Category "${newCategoryName.trim()}" updated successfully`, 'success');
    } catch (error) {
      showToast(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? Meetings assigned to this team will need to be updated or reassigned.')) {
      return;
    }
    try {
      const category = getCategory(id);
      await deleteCategory(id);
      showToast(`Category "${category?.name || id}" deleted successfully`, 'success');
    } catch (error) {
      showToast(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
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
    
    try {
      const seriesName = series.name;
      const meetingCount = series.meetingIds.length;
      await deleteMeetingSeries(seriesId);
      // Reload series
      const updatedSeries = await getMeetingSeries();
      setMeetingSeries(updatedSeries);
      showToast(`Meeting series "${seriesName}" deleted (${meetingCount} meeting(s) removed)`, 'success');
    } catch (error) {
      showToast(`Failed to delete meeting series: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
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

            {/* OAuth Configuration */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                OAuth Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure OAuth Client IDs to enable quick sign-in with Google, Microsoft, or Apple. These are required for the "Sign in with..." buttons to work.
              </p>
              
              <div className="space-y-4">
                {/* Google Client ID */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Google Client ID
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(pendingSettings.oauthClientIds?.google ?? settings.oauthClientIds?.google) || ''}
                    onChange={(e) => {
                      setPendingSettings({
                        ...pendingSettings,
                        oauthClientIds: {
                          ...settings.oauthClientIds,
                          ...pendingSettings.oauthClientIds,
                          google: e.target.value || undefined,
                        },
                      });
                      setHasPendingChanges(true);
                    }}
                    placeholder="Enter your Google OAuth Client ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get this from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>. Redirect URI: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{window.location.origin}{window.location.pathname}</code>
                  </p>
                </div>

                {/* Microsoft Client ID */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
                      <path d="M23 11.4H11.6V0H23v11.4z" fill="#7FBA00"/>
                      <path d="M11.4 23H0V11.6h11.4V23z" fill="#00A4EF"/>
                      <path d="M23 23H11.6V11.6H23V23z" fill="#FFB900"/>
                    </svg>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Microsoft Client ID
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(pendingSettings.oauthClientIds?.microsoft ?? settings.oauthClientIds?.microsoft) || ''}
                    onChange={(e) => {
                      setPendingSettings({
                        ...pendingSettings,
                        oauthClientIds: {
                          ...settings.oauthClientIds,
                          ...pendingSettings.oauthClientIds,
                          microsoft: e.target.value || undefined,
                        },
                      });
                      setHasPendingChanges(true);
                    }}
                    placeholder="Enter your Microsoft OAuth Client ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get this from <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Azure Portal</a>. Redirect URI: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{window.location.origin}{window.location.pathname}</code>
                  </p>
                </div>

                {/* Apple Client ID */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apple Client ID
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(pendingSettings.oauthClientIds?.apple ?? settings.oauthClientIds?.apple) || ''}
                    onChange={(e) => {
                      setPendingSettings({
                        ...pendingSettings,
                        oauthClientIds: {
                          ...settings.oauthClientIds,
                          ...pendingSettings.oauthClientIds,
                          apple: e.target.value || undefined,
                        },
                      });
                      setHasPendingChanges(true);
                    }}
                    placeholder="Enter your Apple OAuth Client ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get this from <a href="https://developer.apple.com/account/resources/identifiers/list" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Developer Portal</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Share & Permalink Settings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Share & Permalink Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure default sharing and permalink options.
              </p>
              
              <div className="space-y-4">
                {/* Default Public Visibility */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Public Visibility for New Meetings
                  </label>
                  <select
                    value={pendingSettings.defaultPublicVisibility ?? settings.defaultPublicVisibility ?? 'private'}
                    onChange={(e) => {
                      setPendingSettings({ ...pendingSettings, defaultPublicVisibility: e.target.value as 'private' | 'busy' | 'titles' | 'full' });
                      setHasPendingChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="private">Private (not visible)</option>
                    <option value="busy">Busy (time only)</option>
                    <option value="titles">Titles Only</option>
                    <option value="full">Full Details</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be the default visibility for newly created meetings
                  </p>
                </div>

                {/* Permalink Base URL */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permalink Base URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={(pendingSettings.permalinkBaseUrl ?? settings.permalinkBaseUrl) || ''}
                    onChange={(e) => {
                      setPendingSettings({ ...pendingSettings, permalinkBaseUrl: e.target.value || undefined });
                      setHasPendingChanges(true);
                    }}
                    placeholder="https://go.rspmgmt.com or leave empty for default"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Base URL for shortened permalinks (e.g., go links). Leave empty to use current domain.
                  </p>
                </div>
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
                    onClick={() => {
                      setPendingSettings({ ...pendingSettings, timeFormat: '12h' });
                      setHasPendingChanges(true);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      (pendingSettings.timeFormat ?? settings.timeFormat) === '12h'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    12 Hour (1:00 PM)
                  </button>
                  <button
                    onClick={() => {
                      setPendingSettings({ ...pendingSettings, timeFormat: '24h' });
                      setHasPendingChanges(true);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      (pendingSettings.timeFormat ?? settings.timeFormat) === '24h'
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
                    value={pendingSettings.timezone !== undefined ? (pendingSettings.timezone || getCurrentTimezone()) : (settings.timezone || getCurrentTimezone())}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPendingSettings({ ...pendingSettings, timezone: value === getCurrentTimezone() ? undefined : value });
                      setHasPendingChanges(true);
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
                                  try {
                                    const result = await syncCalendar(config);
                                    if (result.success) {
                                      // Import meetings
                                      for (const meeting of result.meetings) {
                                        const newId = await getNextMeetingId();
                                        await saveMeeting({ ...meeting, id: newId });
                                      }
                                      showToast(`Synced ${result.meetings.length} meeting(s) from "${config.name}"`, 'success');
                                      // Reload configs
                                      const configs = await getSyncConfigs();
                                      setSyncConfigs(configs);
                                    } else {
                                      showToast(`Sync failed: ${result.error || 'Unknown error'}`, 'error');
                                    }
                                  } catch (error) {
                                    showToast(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                                  } finally {
                                    setSyncing(null);
                                  }
                                }}
                                disabled={syncing !== null || !config.enabled}
                                className="px-3 py-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                              >
                                {syncing === `${config.provider}-${config.name}` ? 'Syncing...' : 'Sync Now'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete the calendar sync "${config.name}"?`)) {
                                    return;
                                  }
                                  try {
                                    const configName = config.name;
                                    const configId = `${config.provider}-${config.name}`;
                                    await deleteSyncConfig(configId);
                                    const configs = await getSyncConfigs();
                                    setSyncConfigs(configs);
                                    showToast(`Calendar sync "${configName}" deleted successfully`, 'success');
                                  } catch (error) {
                                    showToast(`Failed to delete calendar sync: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                                  }
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
                  {/* Quick Sign-In Buttons */}
                  {!showAdvanced && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Connect Calendar
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Sign in with your account to sync calendars, or use an ICS file URL.
                        </p>
                        
                        <div className="space-y-3">
                          {/* Google Sign In */}
                          <button
                            onClick={async () => {
                              const name = prompt('Enter a name for this calendar sync (e.g., "Work Calendar"):');
                              if (!name) return;
                              setSyncFormData({ ...syncFormData, name, provider: 'google' });
                              setConnectingProvider('google');
                              const clientId = settings.oauthClientIds?.google;
                              if (!clientId) {
                                alert('Google OAuth Client ID not configured. Please set it up in Settings > OAuth Configuration first.');
                                setShowAdvanced(true);
                                setSelectedProvider('google');
                                return;
                              }
                              
                              try {
                                const redirectUri = `${window.location.origin}${window.location.pathname}`;
                                const { url, codeVerifier } = await getGoogleAuthUrl(redirectUri, true, clientId);
                                
                                sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                  name,
                                  provider: 'google',
                                  codeVerifier,
                                }));
                                
                                window.location.href = url;
                              } catch (error) {
                                alert(`Failed to start Google sign-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                setConnectingProvider(null);
                              }
                            }}
                            disabled={connectingProvider !== null}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {connectingProvider === 'google' ? 'Connecting...' : 'Sign in with Google'}
                            </span>
                          </button>

                          {/* Microsoft Sign In */}
                          <button
                            onClick={async () => {
                              const clientId = settings.oauthClientIds?.microsoft;
                              if (!clientId) {
                                alert('Microsoft OAuth Client ID not configured. Please set it up in Settings > OAuth Configuration first.');
                                setShowAdvanced(true);
                                setSelectedProvider('outlook');
                                return;
                              }
                              
                              const name = prompt('Enter a name for this calendar sync (e.g., "Work Calendar"):');
                              if (!name) return;
                              setSyncFormData({ ...syncFormData, name, provider: 'outlook' });
                              setConnectingProvider('outlook');
                              try {
                                const redirectUri = `${window.location.origin}${window.location.pathname}`;
                                const { url, codeVerifier } = await getOutlookAuthUrl(redirectUri, true, clientId);
                                
                                sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                  name,
                                  provider: 'outlook',
                                  codeVerifier,
                                }));
                                
                                window.location.href = url;
                              } catch (error) {
                                alert(`Failed to start Microsoft sign-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                setConnectingProvider(null);
                              }
                            }}
                            disabled={connectingProvider !== null}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                              <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
                              <path d="M23 11.4H11.6V0H23v11.4z" fill="#7FBA00"/>
                              <path d="M11.4 23H0V11.6h11.4V23z" fill="#00A4EF"/>
                              <path d="M23 23H11.6V11.6H23V23z" fill="#FFB900"/>
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {connectingProvider === 'outlook' ? 'Connecting...' : 'Sign in with Microsoft'}
                            </span>
                          </button>

                          {/* Apple Sign In */}
                          <button
                            onClick={async () => {
                              const name = prompt('Enter a name for this calendar sync (e.g., "Personal Calendar"):');
                              if (!name) return;
                              setSyncFormData({ ...syncFormData, name, provider: 'apple' });
                              setConnectingProvider('apple');
                              try {
                                const redirectUri = `${window.location.origin}${window.location.pathname}`;
                                const { url, state } = await getAppleAuthUrl(redirectUri);
                                
                                sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                  name,
                                  provider: 'apple',
                                  appleState: state,
                                }));
                                
                                window.location.href = url;
                              } catch (error) {
                                alert(`Failed to start Apple sign-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                setConnectingProvider(null);
                              }
                            }}
                            disabled={connectingProvider !== null}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black dark:bg-gray-900 border-2 border-gray-800 dark:border-gray-700 rounded-lg hover:border-gray-600 dark:hover:border-gray-500 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                            <span className="font-medium text-white">
                              {connectingProvider === 'apple' ? 'Connecting...' : 'Sign in with Apple'}
                            </span>
                          </button>

                          {/* ICS File Option */}
                          <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                            <button
                              onClick={() => {
                                setSelectedProvider('ical');
                                setShowAdvanced(true);
                              }}
                              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                Add ICS File URL
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-300 dark:border-gray-600">
                          <button
                            onClick={() => setShowAdvanced(true)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            Advanced: Manual Setup →
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Advanced Manual Setup */}
                  {showAdvanced && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Advanced Setup</h4>
                        <button
                          onClick={() => {
                            setShowAdvanced(false);
                            setSelectedProvider(null);
                            setSyncFormData({});
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          ← Back to Quick Connect
                        </button>
                      </div>

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
                        </>
                      )}

                      {selectedProvider === 'google' && showAdvanced && (
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
                              const redirectUri = `${window.location.origin}${window.location.pathname}`;
                              const { url } = await getGoogleAuthUrl(redirectUri, false, syncFormData.googleClientId);
                              // Store config temporarily
                              sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                ...syncFormData,
                                provider: 'google',
                                name: syncFormData.name || 'Google Calendar',
                              }));
                              window.location.href = url;
                            }}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Connect Google Calendar
                          </button>
                        </div>
                      )}

                      {selectedProvider === 'outlook' && showAdvanced && (
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
                              const redirectUri = `${window.location.origin}${window.location.pathname}`;
                              const { url } = await getOutlookAuthUrl(redirectUri, false, syncFormData.outlookClientId);
                              sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
                                ...syncFormData,
                                provider: 'outlook',
                                name: syncFormData.name || 'Outlook Calendar',
                              }));
                              window.location.href = url;
                            }}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Connect Outlook
                          </button>
                        </div>
                      )}

                      {(selectedProvider === 'ical' || selectedProvider === 'apple') && showAdvanced && (
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
                                showToast('Please enter a name and ICS URL', 'warning');
                                return;
                              }
                              try {
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
                                showToast(`Calendar sync "${config.name}" saved successfully`, 'success');
                              } catch (error) {
                                showToast(`Failed to save calendar sync: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                              }
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

          {/* Apply Button */}
          {hasPendingChanges && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mt-8 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setPendingSettings({});
                    setHasPendingChanges(false);
                    showToast('Changes cancelled', 'info');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Apply pending settings
                      if (pendingSettings.monthlyViewEnabled !== undefined) {
                        await setMonthlyViewEnabled(pendingSettings.monthlyViewEnabled);
                      }
                      if (pendingSettings.timeFormat !== undefined) {
                        await setTimeFormat(pendingSettings.timeFormat);
                      }
                      if (pendingSettings.timezone !== undefined) {
                        await setTimezone(pendingSettings.timezone);
                      }
                      if (pendingSettings.oauthClientIds !== undefined) {
                        await setOAuthClientIds(pendingSettings.oauthClientIds);
                      }
                      if (pendingSettings.defaultPublicVisibility !== undefined) {
                        await setDefaultPublicVisibility(pendingSettings.defaultPublicVisibility);
                      }
                      if (pendingSettings.permalinkBaseUrl !== undefined) {
                        await setPermalinkBaseUrl(pendingSettings.permalinkBaseUrl);
                      }
                      
                      setPendingSettings({});
                      setHasPendingChanges(false);
                      showToast('Settings saved successfully', 'success');
                    } catch (error) {
                      showToast(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

