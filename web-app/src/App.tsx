import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import CalendarScreen from './components/CalendarScreen';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
// import AuthScreen from './components/AuthScreen'; // Uncomment when requiring authentication
import ToastContainer, { useToast } from './components/ToastContainer';
import { setGlobalToast } from './hooks/useGlobalToast';
import { exchangeGoogleCode, exchangeOutlookCode } from './services/calendarSync';
import { authService, AuthUser } from './services/auth';

function App() {
  const { init, isLoading, error, saveSyncConfig } = useStore();
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  // Set global toast instance
  useEffect(() => {
    setGlobalToast({ showToast });
  }, [showToast]);

  useEffect(() => {
    // Handle OAuth callback - only run once on mount if there's a code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      alert(`OAuth error: ${errorParam}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      const handleOAuthCallback = async () => {
        setOauthProcessing(true);
        try {
          const pendingConfigStr = sessionStorage.getItem('pendingSyncConfig');
          if (!pendingConfigStr) {
            throw new Error('No pending sync configuration found');
          }

          const pendingConfig = JSON.parse(pendingConfigStr);
          const redirectUri = `${window.location.origin}${window.location.pathname}`;

          let accessToken: string;
          let refreshToken: string;
          let expiresIn: number;

          if (pendingConfig.provider === 'google') {
            // Try PKCE first (if codeVerifier exists), then fall back to client secret
            if (pendingConfig.codeVerifier) {
              const tokens = await exchangeGoogleCode(
                code,
                redirectUri,
                pendingConfig.codeVerifier,
                pendingConfig.googleClientId
              );
              accessToken = tokens.accessToken;
              refreshToken = tokens.refreshToken;
              expiresIn = tokens.expiresIn;
            } else if (pendingConfig.googleClientId && pendingConfig.googleClientSecret) {
              const tokens = await exchangeGoogleCode(
                code,
                redirectUri,
                undefined,
                pendingConfig.googleClientId,
                pendingConfig.googleClientSecret
              );
              accessToken = tokens.accessToken;
              refreshToken = tokens.refreshToken;
              expiresIn = tokens.expiresIn;
            } else {
              throw new Error('Google OAuth credentials not found. Please use sign-in button or enter Client ID/Secret in Advanced setup.');
            }
          } else if (pendingConfig.provider === 'outlook') {
            // Try PKCE first, then fall back to client secret
            if (pendingConfig.codeVerifier) {
              const tokens = await exchangeOutlookCode(
                code,
                redirectUri,
                pendingConfig.codeVerifier,
                pendingConfig.outlookClientId
              );
              accessToken = tokens.accessToken;
              refreshToken = tokens.refreshToken;
              expiresIn = tokens.expiresIn;
            } else if (pendingConfig.outlookClientId && pendingConfig.outlookClientSecret) {
              const tokens = await exchangeOutlookCode(
                code,
                redirectUri,
                undefined,
                pendingConfig.outlookClientId,
                pendingConfig.outlookClientSecret
              );
              accessToken = tokens.accessToken;
              refreshToken = tokens.refreshToken;
              expiresIn = tokens.expiresIn;
            } else {
              throw new Error('Outlook OAuth credentials not found. Please use sign-in button or enter Client ID/Secret in Advanced setup.');
            }
          } else if (pendingConfig.provider === 'apple') {
            if (!pendingConfig.appleClientId || !pendingConfig.appleClientSecret) {
              throw new Error('Apple OAuth credentials not found. Apple Sign In requires manual setup with Client ID and Secret.');
            }
            // Import exchangeAppleCode
            const calendarSync = await import('./services/calendarSync');
            const tokens = await calendarSync.exchangeAppleCode(
              code,
              redirectUri,
              pendingConfig.appleClientId,
              pendingConfig.appleClientSecret
            );
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
            expiresIn = tokens.expiresIn;
          } else {
            throw new Error(`Unsupported provider: ${pendingConfig.provider}`);
          }

          // Save sync config
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

          const config: any = {
            id: `${pendingConfig.provider}-${pendingConfig.name}`,
            provider: pendingConfig.provider,
            name: pendingConfig.name,
            enabled: true,
            accessToken,
            refreshToken,
            expiresAt: expiresAt.toISOString(),
          };

          // Add provider-specific fields
          if (pendingConfig.provider === 'google') {
            config.googleCalendarId = pendingConfig.googleCalendarId || 'primary';
          } else if (pendingConfig.provider === 'outlook') {
            config.outlookCalendarId = pendingConfig.outlookCalendarId || 'primary';
          }

          await saveSyncConfig(config);
          sessionStorage.removeItem('pendingSyncConfig');
          alert('Calendar sync configured successfully!');
        } catch (err) {
          console.error('OAuth callback error:', err);
          alert(`Failed to complete OAuth: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setOauthProcessing(false);
        }
      };

      handleOAuthCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - don't depend on saveSyncConfig

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        // Reinitialize store when user logs in
        init().catch((err) => {
          console.error('Failed to initialize app:', err);
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [init]);

  // Initialize app
  useEffect(() => {
    if (user) {
      init().catch((err) => {
        console.error('Failed to initialize app:', err);
      });
    }
  }, [user, init]);

  // Handle OAuth callback from Supabase
  useEffect(() => {
    const handleSupabaseCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && window.location.pathname === '/auth/callback') {
        // Supabase handles the callback automatically
        // Just clean up the URL
        window.history.replaceState({}, document.title, '/');
      }
    };
    
    handleSupabaseCallback();
  }, []);

  if (checkingAuth) {
    return <LoadingScreen />;
  }

  // Show auth screen if not authenticated
  // For now, allow anonymous access (local storage)
  // Uncomment to require authentication:
  // if (!user) {
  //   return <AuthScreen onAuthSuccess={setUser} />;
  // }

  if (isLoading || oauthProcessing) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={init} />;
  }

  return (
    <>
      <CalendarScreen />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;

