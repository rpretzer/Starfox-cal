// Global toast instance - set by App component
let globalToast: {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => string;
} | null = null;

export function setGlobalToast(toast: typeof globalToast) {
  globalToast = toast;
}

export function useGlobalToast() {
  return {
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration?: number) => {
      if (globalToast) {
        return globalToast.showToast(message, type, duration);
      }
      // Toast not yet initialized — surface errors/warnings via console
      if (type === 'error') console.error(`[Toast] ${message}`);
      else if (type === 'warning') console.warn(`[Toast] ${message}`);
      return '';
    },
  };
}

