import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CalendarSyncConfig, CalendarProvider } from '../types';
import { syncCalendar, getGoogleAuthUrl, getOutlookAuthUrl } from '../services/calendarSync';
import { useGlobalToast } from '../hooks/useGlobalToast';
import CalendarSetupWizard from './CalendarSetupWizard';

interface CalendarSyncModalProps {
  onClose: () => void;
}

export default function CalendarSyncModal({ onClose }: CalendarSyncModalProps) {
  const {
    settings,
    getSyncConfigs,
    saveSyncConfig,
    deleteSyncConfig,
    saveMeeting,
    getNextMeetingId,
  } = useStore();

  const [syncConfigs, setSyncConfigs] = useState<CalendarSyncConfig[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<CalendarProvider | null>(null);
  const [syncName, setSyncName] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const { showToast } = useGlobalToast();

  useEffect(() => {
    const loadConfigs = async () => {
      const configs = await getSyncConfigs();
      setSyncConfigs(configs);
    };
    loadConfigs();
  }, [getSyncConfigs]);

  const handleSync = async (config: CalendarSyncConfig) => {
    setSyncing(`${config.provider}-${config.name}`);
    try {
      const result = await syncCalendar(config);
      if (result.success) {
        for (const meeting of result.meetings) {
          const newId = await getNextMeetingId();
          await saveMeeting({ ...meeting, id: newId });
        }
        showToast(`Synced ${result.meetings.length} meeting(s) from "${config.name}"`, 'success');
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
  };

  const handleDelete = async (config: CalendarSyncConfig) => {
    if (!confirm(`Delete calendar sync "${config.name}"?`)) return;
    try {
      await deleteSyncConfig(`${config.provider}-${config.name}`);
      const configs = await getSyncConfigs();
      setSyncConfigs(configs);
      showToast(`Calendar sync "${config.name}" deleted`, 'success');
    } catch (error) {
      showToast(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleGoogleConnect = async () => {
    const name = syncName.trim() || 'Google Calendar';
    const clientId = settings.oauthClientIds?.google;
    if (!clientId) {
      showToast('Google OAuth not configured. Use the Setup Wizard to configure.', 'warning');
      setShowWizard(true);
      return;
    }
    setConnectingProvider('google');
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const { url, codeVerifier } = await getGoogleAuthUrl(redirectUri, true, clientId);
      sessionStorage.setItem('pendingSyncConfig', JSON.stringify({ name, provider: 'google', codeVerifier }));
      window.location.href = url;
    } catch (error) {
      showToast(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setConnectingProvider(null);
    }
  };

  const handleMicrosoftConnect = async () => {
    const name = syncName.trim() || 'Outlook Calendar';
    const clientId = settings.oauthClientIds?.microsoft;
    if (!clientId) {
      showToast('Microsoft OAuth not configured. Use the Setup Wizard to configure.', 'warning');
      setShowWizard(true);
      return;
    }
    setConnectingProvider('outlook');
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const { url, codeVerifier } = await getOutlookAuthUrl(redirectUri, true, clientId);
      sessionStorage.setItem('pendingSyncConfig', JSON.stringify({ name, provider: 'outlook', codeVerifier }));
      window.location.href = url;
    } catch (error) {
      showToast(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setConnectingProvider(null);
    }
  };

  const handleIcsAdd = async () => {
    if (!syncName.trim() || !icsUrl.trim()) {
      showToast('Please enter a name and URL', 'warning');
      return;
    }
    try {
      const config: CalendarSyncConfig & { id: string } = {
        id: `ical-${syncName}`,
        provider: 'ical',
        name: syncName.trim(),
        enabled: true,
        icsUrl: icsUrl.trim(),
      };
      await saveSyncConfig(config);
      const configs = await getSyncConfigs();
      setSyncConfigs(configs);
      setShowAddForm(false);
      setSyncName('');
      setIcsUrl('');
      setSelectedProvider(null);
      showToast(`Calendar "${config.name}" added`, 'success');
    } catch (error) {
      showToast(`Failed to add: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  if (showWizard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="relative w-full max-w-4xl">
          <button
            onClick={() => setShowWizard(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <CalendarSetupWizard
            onComplete={() => {
              setShowWizard(false);
              showToast('Calendar setup completed!', 'success');
            }}
            onSkip={() => setShowWizard(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calendar Sync</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">
              &times;
            </button>
          </div>

          {/* Connected Calendars */}
          {syncConfigs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Connected Calendars</h3>
              <div className="space-y-2">
                {syncConfigs.map((config) => (
                  <div
                    key={`${config.provider}-${config.name}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{config.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {config.provider === 'google' ? 'Google' : config.provider === 'outlook' ? 'Outlook' : 'ICS'}
                        {config.lastSync && ` • Last sync: ${new Date(config.lastSync).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(config)}
                        disabled={syncing !== null}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                      >
                        {syncing === `${config.provider}-${config.name}` ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleDelete(config)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Calendar */}
          {!showAddForm ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                + Add Calendar
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Need help? Use Setup Wizard
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calendar Name
                </label>
                <input
                  type="text"
                  value={syncName}
                  onChange={(e) => setSyncName(e.target.value)}
                  placeholder="e.g., Work Calendar"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {!selectedProvider && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose a provider:</p>
                  <button
                    onClick={handleGoogleConnect}
                    disabled={connectingProvider !== null}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">
                      {connectingProvider === 'google' ? 'Connecting...' : 'Google Calendar'}
                    </span>
                  </button>
                  <button
                    onClick={handleMicrosoftConnect}
                    disabled={connectingProvider !== null}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
                      <path d="M23 11.4H11.6V0H23v11.4z" fill="#7FBA00"/>
                      <path d="M11.4 23H0V11.6h11.4V23z" fill="#00A4EF"/>
                      <path d="M23 23H11.6V11.6H23V23z" fill="#FFB900"/>
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">
                      {connectingProvider === 'outlook' ? 'Connecting...' : 'Outlook / Microsoft 365'}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedProvider('ical')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">ICS / iCal URL</span>
                  </button>
                </div>
              )}

              {selectedProvider === 'ical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ICS URL
                  </label>
                  <input
                    type="url"
                    value={icsUrl}
                    onChange={(e) => setIcsUrl(e.target.value)}
                    placeholder="https://example.com/calendar.ics"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={handleIcsAdd}
                    className="w-full mt-3 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Add Calendar
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedProvider(null);
                  setSyncName('');
                  setIcsUrl('');
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
