import { createContext } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  title?: string;
  message: string;
  variant?: ToastVariant;
  timeout?: number; // ms
}

export interface ToastContextType {
  showToast: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'message'>>) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider y UI del toaster definidos en providers/ToastProvider.tsx
