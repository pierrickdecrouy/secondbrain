// ── Card type color tokens ─────────────────────────────────
// Ces valeurs DOIVENT correspondre aux variables CSS --color-type-* dans index.css
// C'est la source unique de vérité pour les couleurs de type.
export const CARD_COLORS: Record<string, string> = {
    drug:   '#059669',  // emerald-600  → --color-type-drug
    patho:  '#f43f5e',  // rose-500     → --color-type-patho
    physio: '#6366f1',  // indigo-500   → --color-type-physio
    data:   '#f59e0b',  // amber-500    → --color-type-data
    misc:   '#64748b',  // slate-500    → --color-type-misc
};

// Classes Tailwind correspondantes pour les textes/bg (utilisez ces constantes dans vos composants)
export const CARD_TEXT_COLORS: Record<string, string> = {
    drug:   'text-emerald-600',
    patho:  'text-rose-500',
    physio: 'text-indigo-500',
    data:   'text-amber-500',
    misc:   'text-slate-500',
};

export const CARD_BG_COLORS: Record<string, string> = {
    drug:   'bg-emerald-500/10 dark:bg-emerald-500/20',
    patho:  'bg-rose-500/10 dark:bg-rose-500/20',
    physio: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    data:   'bg-amber-500/10 dark:bg-amber-500/20',
    misc:   'bg-slate-500/10 dark:bg-slate-500/20',
};


export const DEFAULT_CARD_ICONS: Record<string, string> = {
    drug: 'Pill',
    patho: 'Biohazard',
    physio: 'Activity',
    data: 'Database'
};

// Deterministic color generation for dynamic types
export function getTypeColor(type: string): string {
    // Return known color if exists
    if (CARD_COLORS[type]) {
        return CARD_COLORS[type];
    }

    // Fallback: Generate consistent HSL color from string hash
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
        hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash) % 360;
    // Saturation 65%, Lightness 45% for good contrast/vibrancy
    return `hsl(${h}, 65%, 45%)`;
}

// Color palette per subject group (bg bar color, text color for icon)
export const GROUP_COLORS = [
    { bar: '#10b981', icon: '#10b981' }, // emerald
    { bar: '#a855f7', icon: '#a855f7' }, // purple
    { bar: '#3b82f6', icon: '#3b82f6' }, // blue
    { bar: '#f43f5e', icon: '#f43f5e' }, // rose
    { bar: '#f59e0b', icon: '#f59e0b' }, // amber
    { bar: '#06b6d4', icon: '#06b6d4' }, // cyan
];
