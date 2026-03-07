import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isOffline: boolean;
  needsUpdate: boolean;
  pendingMutationCount: number;
  promptInstall: () => Promise<void>;
  applyUpdate: () => void;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingMutationCount, setPendingMutationCount] = useState(0);

  const {
    needRefresh: [needsUpdate],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for updates every 60 seconds while app is open
        setInterval(() => r.update(), 60_000);
      }
    },
  });

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleOnline = () => {
      setIsOffline(false);
      // Flush offline queue when connectivity is restored
      import('../services/offlineQueue').then(({ getPendingMutations }) => {
        setPendingMutationCount(getPendingMutations().length);
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh pending count on mount
  useEffect(() => {
    import('../services/offlineQueue').then(({ getPendingMutations }) => {
      setPendingMutationCount(getPendingMutations().length);
    });
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  return {
    isInstallable: installPrompt !== null,
    isOffline,
    needsUpdate,
    pendingMutationCount,
    promptInstall,
    applyUpdate,
  };
}
