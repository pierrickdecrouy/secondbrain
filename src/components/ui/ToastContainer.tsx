import React from 'react';
import { X, CheckCircle, WarningCircle, Info, Warning } from '@phosphor-icons/react';
import { useToastStore } from '../../store/useToastStore';
import type { ToastVariant } from '../../store/useToastStore';
import './styles/ToastContainer.css';

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
      className="toastcontainer-style-1" 
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="toastcontainer-style-2" style={{
  background: style.bg,
  boxShadow: `0 8px 24px ${style.border.replace('0.3', '0.4')}`
}}
          >
            {style.icon}
            <span className="toastcontainer-style-3" >{t.message}</span>
            {t.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="toastcontainer-style-4" 
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              className="toastcontainer-style-5" 
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
