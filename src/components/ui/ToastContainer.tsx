import React from 'react';
import { X, CheckCircle, WarningCircle, Info, Warning } from '@phosphor-icons/react';
import { useToastStore } from '../../store/useToastStore';
import type { ToastVariant } from '../../store/useToastStore';


const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: '#10b981',
    border: 'rgba(16,185,129,0.3)',
    icon: <CheckCircle size={18} weight="fill" />,
  },
  error: {
    bg: '#f43f5e',
    border: 'rgba(244,63,94,0.3)',
    icon: <WarningCircle size={18} weight="fill" />,
  },
  warning: {
    bg: '#f59e0b',
    border: 'rgba(245,158,11,0.3)',
    icon: <Warning size={18} weight="fill" />,
  },
  info: {
    bg: '#3b82f6',
    border: 'rgba(59,130,246,0.3)',
    icon: <Info size={18} weight="fill" />,
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none" 
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-sm rounded-xl text-white font-medium shadow-xl border border-white/10" 
            style={{
              background: style.bg,
              boxShadow: `0 8px 24px ${style.border.replace('0.3', '0.4')}`,
              animation: 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {style.icon}
            <span className="flex-1 text-sm leading-snug">{t.message}</span>
            {t.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors" 
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors shrink-0" 
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};
