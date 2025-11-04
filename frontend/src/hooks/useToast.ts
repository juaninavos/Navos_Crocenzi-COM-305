import { useContext } from 'react';
import type { ToastContextType } from '../contexts/ToastContext';
import { ToastContext } from '../contexts/ToastContext';

export const useToast = () => {
  const ctx = useContext(ToastContext) as ToastContextType | undefined;
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
};

export default useToast;
