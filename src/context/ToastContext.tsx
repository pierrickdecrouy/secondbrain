import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg shadow-lg text-slate-900 dark:text-slate-100 min-w-[300px] max-w-[80vw] animate-[toast-in_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
                toast.type === 'error' ? 'border-red-500/50' : 
                toast.type === 'success' ? 'border-emerald-500/50' : 
                toast.type === 'warning' ? 'border-amber-500/50' : 
                'border-slate-200 dark:border-slate-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <XCircle size={20} className="text-red-500 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-500 shrink-0" />}
            {toast.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
            
            <span className="flex-1 text-[0.9rem] font-medium">{toast.message}</span>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="bg-transparent border-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 flex shrink-0 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
