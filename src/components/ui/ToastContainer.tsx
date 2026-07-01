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
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 10000,
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: style.bg,
              color: 'white',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: `0 8px 24px ${style.border.replace('0.3', '0.4')}`,
              pointerEvents: 'all',
              animation: 'toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              maxWidth: '420px',
              minWidth: '240px',
            }}
          >
            {style.icon}
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginLeft: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                opacity: 0.8,
              }}
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
