import { useMSAuth } from '../hooks/useMSAuth';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface MSConnectButtonProps {
  onConnected?: () => void;
  className?: string;
}

export default function MSConnectButton({ onConnected, className = '' }: MSConnectButtonProps) {
  const { account, isLoading, isConfigured, signIn, signOut } = useMSAuth();
  const { showToast } = useGlobalToast();

  const handleConnect = async () => {
    try {
      await signIn();
      showToast('Connected to Microsoft 365', 'success');
      onConnected?.();
    } catch {
      showToast('Failed to connect to Microsoft 365', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
      showToast('Disconnected from Microsoft 365', 'success');
    } catch {
      showToast('Failed to disconnect', 'error');
    }
  };

  if (!isConfigured) {
    return (
      <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Microsoft 365 integration requires{' '}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">VITE_MS_CLIENT_ID</code>{' '}
        to be configured.
      </p>
    );
  }

  if (account) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
              {account.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {account.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {account.username}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 ${className}`}
    >
      {/* Microsoft logo */}
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23" fill="none" aria-hidden="true">
        <path fill="#F25022" d="M0 0h11v11H0z"/>
        <path fill="#00A4EF" d="M12 0h11v11H12z"/>
        <path fill="#7FBA00" d="M0 12h11v11H0z"/>
        <path fill="#FFB900" d="M12 12h11v11H12z"/>
      </svg>
      <span className="font-medium">
        {isLoading ? 'Connecting…' : 'Connect Microsoft 365'}
      </span>
    </button>
  );
}
