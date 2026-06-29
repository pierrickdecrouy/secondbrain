import { useAuth } from '../context/AuthContext';

export type Tier = 'offline' | 'free' | 'pro';

// Features guardées par tier
const TIER_ACCESS: Record<string, Tier[]> = {
    dashboard:  ['offline', 'free', 'pro'],
    cards:      ['offline', 'free', 'pro'],
    review:     ['offline', 'free', 'pro'],
    courses:    ['offline', 'free', 'pro'],
    // Nécessite un compte (même gratuit)
    network:    ['free', 'pro'],
    stats:      ['free', 'pro'],
    settings:   ['free', 'pro'],
    // Réservé pro (pour Stripe plus tard)
    anki_export: ['pro'],
    batch_import: ['pro'],
};

export const useTier = (): { tier: Tier; canAccess: (feature: string) => boolean } => {
    const { user } = useAuth();

    // Pour l'instant : connecté = pro (Stripe non intégré)
    // Quand Stripe sera là, lire subscription.status depuis Firestore ici
    let tier: Tier;
    if (!user) {
        tier = 'offline';
    } else {
        tier = 'pro'; // tout utilisateur connecté est pro pour l'instant
    }

    const canAccess = (feature: string): boolean => {
        const allowed = TIER_ACCESS[feature];
        if (!allowed) return true; // feature non listée = accessible
        return allowed.includes(tier);
    };

    return { tier, canAccess };
};
