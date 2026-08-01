import React from 'react';

// ── Reusable card wrapper ──────────────────────────────────────────────────
export const SettingsCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    danger?: boolean;
}> = ({ children, className, danger }) => (
    <div
        className={`bg-white dark:bg-slate-900 rounded-2xl border ${danger ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-700'} shadow-sm overflow-hidden ${className || ''}`}
    >
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
    <div className={`px-6 py-5 flex justify-between gap-4 border-b border-slate-200 dark:border-slate-700 ${icon || action ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && (
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    {icon}
                </div>
            )}
            <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</div>
                {subtitle && <div className="text-sm mt-0.5 text-slate-500 dark:text-slate-400">{subtitle}</div>}
            </div>
        </div>
        {action}
    </div>
);

// ── Card body ──────────────────────────────────────────────────────────────
export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`px-6 py-5 ${className || ''}`}>
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
    <div className={`flex items-center justify-between gap-6 px-6 py-4 ${last ? '' : 'border-b border-slate-200 dark:border-slate-700'}`}>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
            {description && <div className="text-xs mt-1 leading-relaxed text-slate-500 dark:text-slate-400">{description}</div>}
        </div>
        <div className="shrink-0">
            {children}
        </div>
    </div>
);

// ── Section heading (above a group of cards) ───────────────────────────────
export const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
);

// ── Inline label above an input ────────────────────────────────────────────
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {children}
    </label>
);

// ── Text input ─────────────────────────────────────────────────────────────
export const SettingsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all ${props.className || ''}`}
    />
);

// ── Select ─────────────────────────────────────────────────────────────────
export const SettingsSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className={`w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 cursor-pointer transition-all ${props.className || ''}`}
    />
);

// ── Primary button ─────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({ small, children, ...props }) => (
    <button
        {...props}
        className={`inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white border-none rounded-xl font-semibold cursor-pointer transition-all shadow-sm ${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${props.className || ''}`}
    >
        {children}
    </button>
);

// ── Ghost / secondary button ───────────────────────────────────────────────
export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({ small, children, ...props }) => (
    <button
        {...props}
        className={`inline-flex items-center gap-2 bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${props.className || ''}`}
    >
        {children}
    </button>
);

// ── Danger button ──────────────────────────────────────────────────────────
export const DangerButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
    <button
        {...props}
        className={`inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer transition-all active:scale-95 ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${props.className || ''}`}
    >
        {children}
    </button>
);

// ── Badge / tag ────────────────────────────────────────────────────────────
export const Badge: React.FC<{ color?: string; bg?: string; children: React.ReactNode }> = ({ color, bg, children }) => (
    <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20"
        style={color || bg ? { backgroundColor: bg, color: color, borderColor: color ? `${color}40` : undefined } : undefined}
    >
        {children}
    </span>
);

// ── Stat number card ───────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string | number; color?: string; sub?: string }> = ({ label, value, color, sub }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{label}</div>
        <div
            className="text-3xl font-extrabold tracking-tight"
            style={color ? { color } : {}}
        >
            <span className={!color ? 'text-slate-900 dark:text-slate-100' : ''}>{value}</span>
        </div>
        {sub && <div className="text-xs mt-1.5 text-slate-500 dark:text-slate-400 font-medium">{sub}</div>}
    </div>
);
