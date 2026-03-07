import { useState, useEffect, useCallback } from 'react';
import type { MSAccount } from '../services/msalService';
import { msGetAccount, msSignIn, msSignOut, isMSConfigured } from '../services/msalService';

interface UseMSAuthReturn {
  account: MSAccount | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export function useMSAuth(): UseMSAuthReturn {
  const [account, setAccount] = useState<MSAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isMSConfigured();

  useEffect(() => {
    if (!isConfigured) return;
    msGetAccount()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, [isConfigured]);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { account: acc } = await msSignIn();
      setAccount(acc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await msSignOut();
      setAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { account, isLoading, isConfigured, signIn, signOut, error };
}
