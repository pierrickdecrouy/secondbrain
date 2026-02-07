export const CARD_COLORS = {
    drug: '#0d9488',   // teal-600
    patho: '#dc2626',  // red-600
    physio: '#7c3aed', // violet-600
    data: '#d97706',   // amber-600
} as const;

export type CardColorKey = keyof typeof CARD_COLORS;
