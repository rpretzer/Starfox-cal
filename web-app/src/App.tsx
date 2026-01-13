import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import CalendarScreen from './components/CalendarScreen';
import LoadingScreen from './components/LoadingScreen';
// import AuthScreen from './components/AuthScreen'; // Uncomment when requiring authentication
import ToastContainer, { useToast } from './components/ToastContainer';
import { setGlobalToast } from './hooks/useGlobalToast';
import { exchangeGoogleCode, exchangeOutlookCode } from './services/calendarSync';
import { authService } from './services/auth';

function App() {
  const { init, isLoading, saveSyncConfig, subscribeToRealtimeUpdates, refreshAll } = useStore();
  const [oauthProcessing, setOauthProcessing] = useState(false);
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
          // Use consistent redirect URI that matches OAuth provider configuration
          const redirectUri = `${window.location.origin}/auth/callback`;

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

  // Check authentication on mount (with timeout)
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Add timeout to prevent hanging
        const authCheck = Promise.race([
          authService.getCurrentUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)), // 1 second timeout
        ]);
        
        // Auth check - user state is handled by auth service
        await authCheck;
      } catch (err) {
        console.warn('Auth check failed (using local storage):', err);
        // Continue without authentication - app will use IndexedDB
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };
    
    checkAuth();

    // Listen for auth state changes (only if Supabase is configured)
    let subscription: { unsubscribe: () => void } | null = null;
    (async () => {
      try {
        const authStateChange = await authService.onAuthStateChange((user) => {
          if (mounted && user) {
            // Reinitialize store when user logs in
            init().catch((err) => {
              console.error('Failed to initialize app:', err);
            });
          }
        });
        
        subscription = authStateChange.data?.subscription || null;
      } catch (error) {
        console.warn('Failed to set up auth listener (using local storage):', error);
      }
    })();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [init]);

  // Initialize app - load cached data immediately, then refresh from storage
  useEffect(() => {
    // Always try to init, even if user is null (for local storage)
    // Cached data from localStorage will show immediately via persistence middleware
    init().catch((err) => {
      console.error('Failed to initialize app:', err);
    });
  }, [init]);

  // Subscribe to real-time updates for cross-device/tab sync
  useEffect(() => {
    const subscription = subscribeToRealtimeUpdates();
    return () => {
      subscription.unsubscribe();
    };
  }, [subscribeToRealtimeUpdates]);

  // Sync-on-focus: refresh data when user returns to tab/app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing data...');
        refreshAll().catch((err) => {
          console.warn('Failed to refresh on visibility change:', err);
        });
      }
    };

    const handleFocus = () => {
      console.log('Window focused, refreshing data...');
      refreshAll().catch((err) => {
        console.warn('Failed to refresh on focus:', err);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAll]);

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

  // Show loading screen only briefly - cached data will show immediately
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Show UI quickly - cached data from localStorage will be visible immediately
    // Only show loading if we don't have cached data and are still initializing
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Reduced from 3 seconds to 500ms - cached data loads instantly
    
    return () => clearTimeout(timer);
  }, []);

  // Only show loading screen if we're checking auth AND don't have cached data
  // If we have cached data (from persistence), show UI immediately
  const { meetings, categories } = useStore();
  const hasCachedData = meetings.length > 0 || categories.length > 0;
  
  if ((checkingAuth || (isLoading && !hasCachedData) || oauthProcessing) && showLoading) {
    return <LoadingScreen />;
  }

  // Show auth screen if not authenticated
  // For now, allow anonymous access (local storage)
  // Uncomment to require authentication:
  // if (!user) {
  //   return <AuthScreen onAuthSuccess={setUser} />;
  // }

  // Don't show error screen - just show UI with defaults
  // if (error) {
  //   return <ErrorScreen error={error} onRetry={init} />;
  // }

  return (
    <>
      <CalendarScreen />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;

