import React, { useCallback, useMemo, useState } from 'react';
import { ToastContext, type ToastContextType, type ToastItem, type ToastVariant } from '../contexts/ToastContext';

const variantClass = (v?: ToastVariant) => {
  switch (v) {
    case 'success': return 'toast-success';
    case 'danger': return 'toast-danger';
    case 'warning': return 'toast-warning';
    default: return 'toast-info';
  }
};

const Toaster: React.FC<{ toasts: ToastItem[]; onClose: (id: number) => void }> = ({ toasts, onClose }) => {
  return (
    <div className="toaster-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${variantClass(t.variant)}`} role="status" aria-live="polite">
          <div className="toast-content">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-message">{t.message}</div>
          </div>
          <button className="toast-close" type="button" aria-label="Cerrar" onClick={() => onClose(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast: ToastContextType['showToast'] = useCallback((message, options) => {
    const id = Date.now() + Math.random();
    const item: ToastItem = {
      id,
      message,
      title: options?.title,
      variant: options?.variant ?? 'info',
      timeout: options?.timeout ?? 3500,
    };
    setToasts(prev => [...prev, item]);

    if (item.timeout && item.timeout > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, item.timeout);
    }
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
