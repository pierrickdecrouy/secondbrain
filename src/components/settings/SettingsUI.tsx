/**
 * Shared design tokens & primitives for the Settings UI.
 * All settings components import from here for visual consistency.
 */
import React from 'react';

// ── Semantic CSS variable aliases (work in both light & dark) ──────────────
export const S = {
  bg:          'var(--color-bg)',
  surface:     'var(--color-surface)',
  surfaceHover:'var(--color-surface-hover)',
  border:      'var(--color-border)',
  text:        'var(--color-text)',
  muted:       'var(--color-text-muted)',
  primary:     '#10b981',
  primaryDim:  'rgba(16,185,129,0.12)',
  primaryBorder:'rgba(16,185,129,0.25)',
  danger:      '#ef4444',
  dangerDim:   'rgba(239,68,68,0.1)',
  warning:     '#f59e0b',
  warningDim:  'rgba(245,158,11,0.1)',
};

// ── Reusable card wrapper ──────────────────────────────────────────────────
export const SettingsCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  danger?: boolean;
}> = ({ children, style, danger }) => (
  <div style={{
    background: S.surface,
    border: `1px solid ${danger ? 'rgba(239,68,68,0.35)' : S.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

// ── Section header inside a card ───────────────────────────────────────────
export const CardSection: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, subtitle, action, icon }) => (
  <div style={{
    padding: '16px 20px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    alignItems: icon || action ? 'center' : undefined,
    justifyContent: 'space-between',
    gap: 12,
    background: 'transparent',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: S.primaryDim, color: S.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: S.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    {action}
  </div>
);

// ── Card body ──────────────────────────────────────────────────────────────
export const CardBody: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ padding: '20px', ...style }}>
    {children}
  </div>
);

// ── Row with label + value aligned ─────────────────────────────────────────
export const SettingsRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ label, description, children, last }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: '14px 20px',
    borderBottom: last ? 'none' : `1px solid ${S.border}`,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, color: S.text, fontWeight: 500 }}>{label}</div>
      {description && <div style={{ fontSize: 12, color: S.muted, marginTop: 2, lineHeight: 1.5 }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>
      {children}
    </div>
  </div>
);

// ── Section heading (above a group of cards) ───────────────────────────────
export const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 12 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: S.text, margin: '0 0 4px 0', letterSpacing: '-0.2px' }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 13, color: S.muted, margin: 0 }}>{subtitle}</p>}
  </div>
);

// ── Inline label above an input ────────────────────────────────────────────
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: S.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  }}>
    {children}
  </label>
);

// ── Text input ─────────────────────────────────────────────────────────────
export const SettingsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%',
      padding: '9px 14px',
      background: S.bg,
      border: `1px solid ${S.border}`,
      borderRadius: 10,
      fontSize: 14,
      color: S.text,
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s',
      ...props.style,
    }}
  />
);

// ── Select ─────────────────────────────────────────────────────────────────
export const SettingsSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    style={{
      width: '100%',
      padding: '9px 14px',
      background: S.bg,
      border: `1px solid ${S.border}`,
      borderRadius: 10,
      fontSize: 14,
      color: S.text,
      outline: 'none',
      boxSizing: 'border-box',
      cursor: 'pointer',
      ...props.style,
    }}
  />
);

// ── Primary button ─────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({ small, children, style, ...props }) => (
  <button
    {...props}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: S.primary,
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      padding: small ? '7px 14px' : '10px 20px',
      fontSize: small ? 13 : 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.15s',
      whiteSpace: 'nowrap',
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
  >
    {children}
  </button>
);

// ── Ghost / secondary button ───────────────────────────────────────────────
export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({ small, children, style, ...props }) => (
  <button
    {...props}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'transparent',
      color: S.muted,
      border: `1px solid ${S.border}`,
      borderRadius: 10,
      padding: small ? '6px 12px' : '9px 18px',
      fontSize: small ? 13 : 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'color 0.15s, border-color 0.15s',
      whiteSpace: 'nowrap',
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.color = S.text; e.currentTarget.style.borderColor = S.muted; }}
    onMouseLeave={e => { e.currentTarget.style.color = S.muted; e.currentTarget.style.borderColor = S.border; }}
  >
    {children}
  </button>
);

// ── Danger button ──────────────────────────────────────────────────────────
export const DangerButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'transparent',
      color: S.danger,
      border: `1px solid ${S.danger}`,
      borderRadius: 10,
      padding: '9px 18px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background 0.15s',
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.background = S.dangerDim; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);

// ── Badge / tag ────────────────────────────────────────────────────────────
export const Badge: React.FC<{ color?: string; bg?: string; children: React.ReactNode }> = ({ color, bg, children }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: bg || S.primaryDim,
    color: color || S.primary,
    border: `1px solid ${color ? color + '44' : S.primaryBorder}`,
  }}>
    {children}
  </span>
);

// ── Stat number card ───────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string | number; color?: string; sub?: string }> = ({ label, value, color, sub }) => (
  <div style={{
    background: S.surface,
    border: `1px solid ${S.border}`,
    borderRadius: 14,
    padding: '18px 20px',
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || S.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: S.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);
