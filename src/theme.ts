// Core colors for known types
export const CARD_COLORS: Record<string, string> = {
    drug: '#0d9488',   // teal-600
    patho: '#dc2626',  // red-600
    physio: '#7c3aed', // violet-600
    data: '#d97706',   // amber-600
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
