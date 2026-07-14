// Core colors for known types
export const CARD_COLORS: Record<string, string> = {
    drug: '#059669',
    patho: '#f43f5e',
    physio: '#6366f1',
    data: '#f59e0b',
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
