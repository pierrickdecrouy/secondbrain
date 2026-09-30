import { useAuth } from '../context/AuthContext';
import { useLicense } from './useLicense';

export type Tier = 'offline' | 'trial' | 'free' | 'pro';

// Accès par tier
const TIER_ACCESS: Record<string, Tier[]> = {
    dashboard:    ['offline', 'trial', 'free', 'pro'],
    cards:        ['offline', 'trial', 'free', 'pro'],
    review:       ['offline', 'trial', 'free', 'pro'],
    courses:      ['offline', 'trial', 'free', 'pro'],
    // Nécessite un compte connecté
    network:      ['trial', 'free', 'pro'],
    stats:        ['trial', 'free', 'pro'],
    settings:     ['offline', 'trial', 'free', 'pro'],
    // Pro seulement (accès whitelist ou trial)
    anki_export:  ['trial', 'pro'],
    batch_import: ['trial', 'pro'],
};

export const useTier = (): { tier: Tier; canAccess: (feature: string) => boolean } => {
    const { user } = useAuth();
    const { licenseInfo } = useLicense();

    let tier: Tier;

    if (!user) {
        tier = 'offline';
    } else if (licenseInfo.status === 'active') {
        tier = 'pro';
    } else if (licenseInfo.status === 'trial') {
        tier = 'trial';
    } else if (licenseInfo.status === 'checking') {
        // Pendant la vérification : accès optimiste trial
        tier = 'trial';
    } else {
        // none → free tier (compte connecté mais sans accès)
        tier = 'free';
    }

    const canAccess = (feature: string): boolean => {
        const allowed = TIER_ACCESS[feature];
        if (!allowed) return true;
        return allowed.includes(tier);
    };

    return { tier, canAccess };
};
