import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CalendarProvider } from '../types';
import { getGoogleAuthUrl, getOutlookAuthUrl, getAppleAuthUrl } from '../services/calendarSync';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface CalendarSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type WizardStep = 'intro' | 'oauth-google' | 'oauth-microsoft' | 'oauth-apple' | 'connect-calendar' | 'complete';

export default function CalendarSetupWizard({ onComplete, onSkip }: CalendarSetupWizardProps) {
  const { settings, setOAuthClientIds } = useStore();
  const { showToast } = useGlobalToast();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [googleClientId, setGoogleClientId] = useState(settings.oauthClientIds?.google || '');
  const [microsoftClientId, setMicrosoftClientId] = useState(settings.oauthClientIds?.microsoft || '');
  const [appleClientId, setAppleClientId] = useState(settings.oauthClientIds?.apple || '');
  const [connectingProvider, setConnectingProvider] = useState<CalendarProvider | null>(null);

  const handleSaveOAuthConfig = async () => {
    try {
      await setOAuthClientIds({
        google: googleClientId || undefined,
        microsoft: microsoftClientId || undefined,
        apple: appleClientId || undefined,
      });
      showToast('OAuth configuration saved successfully', 'success');
    } catch (error) {
      showToast(`Failed to save OAuth configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleConnectCalendar = async (provider: CalendarProvider) => {
    setConnectingProvider(provider);
    
    try {
      let clientId: string | undefined;
      let authUrl: string;
      let codeVerifier: string | undefined;
      let state: string | undefined;

      const redirectUri = `${window.location.origin}/auth/callback`;

      switch (provider) {
        case 'google':
          clientId = settings.oauthClientIds?.google;
          if (!clientId) {
            showToast('Google Client ID not configured. Please set it up first.', 'error');
            setCurrentStep('oauth-google');
            setConnectingProvider(null);
            return;
          }
          const googleAuth = await getGoogleAuthUrl(redirectUri, true, clientId);
          authUrl = googleAuth.url;
          codeVerifier = googleAuth.codeVerifier;
          break;

        case 'outlook':
          clientId = settings.oauthClientIds?.microsoft;
          if (!clientId) {
            showToast('Microsoft Client ID not configured. Please set it up first.', 'error');
            setCurrentStep('oauth-microsoft');
            setConnectingProvider(null);
            return;
          }
          const outlookAuth = await getOutlookAuthUrl(redirectUri, true, clientId);
          authUrl = outlookAuth.url;
          codeVerifier = outlookAuth.codeVerifier;
          break;

        case 'apple':
          clientId = settings.oauthClientIds?.apple;
          if (!clientId) {
            showToast('Apple Client ID not configured. Please set it up first.', 'error');
            setCurrentStep('oauth-apple');
            setConnectingProvider(null);
            return;
          }
          const appleAuth = await getAppleAuthUrl(redirectUri);
          authUrl = appleAuth.url;
          state = appleAuth.state;
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store pending config
      sessionStorage.setItem('pendingSyncConfig', JSON.stringify({
        provider,
        codeVerifier,
        appleState: state,
        [`${provider}ClientId`]: clientId,
      }));

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      showToast(`Failed to connect ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setConnectingProvider(null);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Calendar Sync Setup
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Connect your external calendars to sync meetings automatically. This wizard will guide you through the setup process.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What you'll need:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>OAuth Client IDs from Google, Microsoft, or Apple</li>
                <li>Access to your calendar accounts</li>
                <li>About 5-10 minutes to complete</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setCurrentStep('oauth-google')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        );

      case 'oauth-google':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep('intro')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Step 1: Configure Google OAuth
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Set up your Google OAuth Client ID to enable Google Calendar sync.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Create a new OAuth 2.0 Client ID (Web application)</li>
                <li>Add authorized redirect URI: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{window.location.origin}/auth/callback</code></li>
                <li>Copy your Client ID and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google Client ID
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="435971793181-xxxxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCurrentStep('oauth-microsoft');
                  handleSaveOAuthConfig();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Next: Microsoft
              </button>
            </div>
          </div>
        );

      case 'oauth-microsoft':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep('oauth-google')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Step 2: Configure Microsoft OAuth (Optional)
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Set up Microsoft OAuth Client ID for Outlook Calendar sync. You can skip this if you only use Google Calendar.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Azure Portal</a></li>
                <li>Register a new application</li>
                <li>Add redirect URI: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{window.location.origin}/auth/callback</code></li>
                <li>Copy your Application (client) ID and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Microsoft Client ID (Optional)
              </label>
              <input
                type="text"
                value={microsoftClientId}
                onChange={(e) => setMicrosoftClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCurrentStep('oauth-apple');
                  handleSaveOAuthConfig();
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setCurrentStep('oauth-apple');
                  handleSaveOAuthConfig();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Next: Apple
              </button>
            </div>
          </div>
        );

      case 'oauth-apple':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep('oauth-microsoft')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Step 3: Configure Apple OAuth (Optional)
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Set up Apple OAuth Client ID for iCloud Calendar sync. You can skip this if you don't use Apple Calendar.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Go to <a href="https://developer.apple.com/account/resources/identifiers/list" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Developer Portal</a></li>
                <li>Create a new Services ID</li>
                <li>Add redirect URI: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{window.location.origin}/auth/callback</code></li>
                <li>Copy your Services ID and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apple Client ID (Optional)
              </label>
              <input
                type="text"
                value={appleClientId}
                onChange={(e) => setAppleClientId(e.target.value)}
                placeholder="com.example.service"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCurrentStep('connect-calendar');
                  handleSaveOAuthConfig();
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setCurrentStep('connect-calendar');
                  handleSaveOAuthConfig();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Next: Connect Calendar
              </button>
            </div>
          </div>
        );

      case 'connect-calendar':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep('oauth-apple')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Step 4: Connect Your Calendar
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Now that OAuth is configured, connect your calendar accounts to start syncing meetings.
              </p>
            </div>

            <div className="space-y-3">
              {settings.oauthClientIds?.google && (
                <button
                  onClick={() => handleConnectCalendar('google')}
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
                    {connectingProvider === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
                  </span>
                </button>
              )}

              {settings.oauthClientIds?.microsoft && (
                <button
                  onClick={() => handleConnectCalendar('outlook')}
                  disabled={connectingProvider !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0078D4">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {connectingProvider === 'outlook' ? 'Connecting...' : 'Connect Microsoft Outlook'}
                  </span>
                </button>
              )}

              {settings.oauthClientIds?.apple && (
                <button
                  onClick={() => handleConnectCalendar('apple')}
                  disabled={connectingProvider !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black dark:bg-gray-900 border-2 border-gray-800 dark:border-gray-700 rounded-lg hover:border-gray-600 dark:hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="font-medium text-white">
                    {connectingProvider === 'apple' ? 'Connecting...' : 'Connect Apple iCloud'}
                  </span>
                </button>
              )}

              {!settings.oauthClientIds?.google && !settings.oauthClientIds?.microsoft && !settings.oauthClientIds?.apple && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No OAuth providers configured. Please go back and configure at least one provider.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCurrentStep('complete')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Setup Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your calendar sync is now configured. You can manage your connected calendars and sync settings from the Settings page.
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Finish
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {currentStep === 'intro' && 'Introduction'}
              {currentStep === 'oauth-google' && 'Step 1 of 4'}
              {currentStep === 'oauth-microsoft' && 'Step 2 of 4'}
              {currentStep === 'oauth-apple' && 'Step 3 of 4'}
              {currentStep === 'connect-calendar' && 'Step 4 of 4'}
              {currentStep === 'complete' && 'Complete'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep !== 'intro' && currentStep !== 'complete' && (
                `${['oauth-google', 'oauth-microsoft', 'oauth-apple', 'connect-calendar'].indexOf(currentStep) + 1}/4`
              )}
            </span>
          </div>
          {currentStep !== 'intro' && currentStep !== 'complete' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((['oauth-google', 'oauth-microsoft', 'oauth-apple', 'connect-calendar'].indexOf(currentStep) + 1) / 4) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {renderStep()}
      </div>
    </div>
  );
}

