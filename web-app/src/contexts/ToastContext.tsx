import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../components/ToastContainer';
import type { ToastType } from '../components/ToastContainer';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

