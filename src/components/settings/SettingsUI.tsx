/**
 * Shared design tokens & primitives for the Settings UI.
 * All settings components import from here for visual consistency.
 */
import React from 'react';
import './styles/SettingsUI.css';

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
  className?: string;
  danger?: boolean;
}> = ({ children, style, className, danger }) => (
  <div className={`settingsui-style-1 ${className || ''}`} style={{
  background: S.surface,
  border: `1px solid ${danger ? 'rgba(239,68,68,0.35)' : S.border}`,
  ...style
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
  <div className="settingsui-style-2" style={{
  borderBottom: `1px solid ${S.border}`,
  alignItems: icon || action ? 'center' : undefined
}}>
    <div className="settingsui-style-3" >
      {icon && (
        <div className="settingsui-style-4" style={{
  background: S.primaryDim,
  color: S.primary
}}>
          {icon}
        </div>
      )}
      <div>
        <div className="settingsui-style-5" style={{
  color: S.text
}}>{title}</div>
        {subtitle && <div className="settingsui-style-6" style={{
  color: S.muted
}}>{subtitle}</div>}
      </div>
    </div>
    {action}
  </div>
);

// ── Card body ──────────────────────────────────────────────────────────────
export const CardBody: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={`settingsui-style-7 ${className || ''}`} style={{
  ...style
}}>
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
  <div className="settingsui-style-8" style={{
  borderBottom: last ? 'none' : `1px solid ${S.border}`
}}>
    <div className="settingsui-style-9" >
      <div className="settingsui-style-10" style={{
  color: S.text
}}>{label}</div>
      {description && <div className="settingsui-style-11" style={{
  color: S.muted
}}>{description}</div>}
    </div>
    <div className="settingsui-style-12" >
      {children}
    </div>
  </div>
);

// ── Section heading (above a group of cards) ───────────────────────────────
export const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="settingsui-style-13" >
    <h2 className="settingsui-style-14" style={{
  color: S.text
}}>{title}</h2>
    {subtitle && <p className="settingsui-style-15" style={{
  color: S.muted
}}>{subtitle}</p>}
  </div>
);

// ── Inline label above an input ────────────────────────────────────────────
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="settingsui-style-16" style={{
  color: S.muted
}}>
    {children}
  </label>
);

// ── Text input ─────────────────────────────────────────────────────────────
export const SettingsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="settingsui-style-17" style={{
  background: S.bg,
  border: `1px solid ${S.border}`,
  color: S.text,
  ...props.style
}}
  />
);

// ── Select ─────────────────────────────────────────────────────────────────
export const SettingsSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="settingsui-style-18" style={{
  background: S.bg,
  border: `1px solid ${S.border}`,
  color: S.text,
  ...props.style
}}
  />
);

// ── Primary button ─────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({ small, children, style, ...props }) => (
  <button
    {...props}
    className="settingsui-style-19" style={{
  background: S.primary,
  padding: small ? '7px 14px' : '10px 20px',
  fontSize: small ? 13 : 14,
  ...style
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
    className="settingsui-style-20" style={{
  color: S.muted,
  border: `1px solid ${S.border}`,
  padding: small ? '6px 12px' : '9px 18px',
  fontSize: small ? 13 : 14,
  ...style
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
    className="settingsui-style-21" style={{
  color: S.danger,
  border: `1px solid ${S.danger}`,
  ...style
}}
    onMouseEnter={e => { e.currentTarget.style.background = S.dangerDim; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);

// ── Badge / tag ────────────────────────────────────────────────────────────
export const Badge: React.FC<{ color?: string; bg?: string; children: React.ReactNode }> = ({ color, bg, children }) => (
  <span className="settingsui-style-22" style={{
  background: bg || S.primaryDim,
  color: color || S.primary,
  border: `1px solid ${color ? color + '44' : S.primaryBorder}`
}}>
    {children}
  </span>
);

// ── Stat number card ───────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string | number; color?: string; sub?: string }> = ({ label, value, color, sub }) => (
  <div className="settingsui-style-23" style={{
  background: S.surface,
  border: `1px solid ${S.border}`
}}>
    <div className="settingsui-style-24" style={{
  color: S.muted
}}>{label}</div>
    <div className="settingsui-style-25" style={{
  color: color || S.text
}}>{value}</div>
    {sub && <div className="settingsui-style-26" style={{
  color: S.muted
}}>{sub}</div>}
  </div>
);
