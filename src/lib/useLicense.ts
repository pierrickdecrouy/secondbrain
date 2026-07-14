/**
 * useLicense — Gestion de licence LemonSqueezy
 *
 * Flux :
 * 1. L'utilisateur entre sa clé de licence dans les Settings
 * 2. La clé est validée via l'API LemonSqueezy
 * 3. Le résultat est stocké dans Firestore (lié au UID Firebase)
 * 4. Re-vérification toutes les 24h (ou au démarrage si le cache est expiré)
 * 5. En cas d'absence de réseau, on utilise le cache Firestore (grace period 7j)
 */

import { useState, useEffect, useCallback } from 'react';
import {
    doc, getDoc, setDoc, serverTimestamp,
    type Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LicenseStatus =
    | 'checking'    // En cours de vérification
    | 'active'      // Licence valide et active
    | 'expired'     // Licence expirée (LemonSqueezy)
    | 'invalid'     // Clé invalide ou révoquée
    | 'none'        // Pas de clé configurée
    | 'grace'       // Pas de réseau, on utilise le cache (max 7j)
    | 'trial';      // Période d'essai (14j depuis l'inscription)

export interface LicenseInfo {
    status: LicenseStatus;
    licenseKey?: string;
    activatedAt?: Date | null;
    expiresAt?: Date | null;  // null = lifetime
    planName?: string;        // 'monthly' | 'annual' | 'lifetime'
    instanceId?: string;      // ID d'activation LemonSqueezy
    lastChecked?: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEMONSQUEEZY_API = import.meta.env.VITE_LEMONSQUEEZY_API_URL || 'https://api.lemonsqueezy.com/v1';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;  // 24h
const GRACE_PERIOD_MS   =  7 * 24 * 60 * 60 * 1000;  // 7 jours
const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;  // 14 jours

// ─── Firestore helpers ────────────────────────────────────────────────────────

function licenseDocRef(uid: string) {
    return doc(db, 'licenses', uid);
}

async function readLicenseFromFirestore(uid: string): Promise<LicenseInfo | null> {
    try {
        const snap = await getDoc(licenseDocRef(uid));
        if (!snap.exists()) return null;

        const data = snap.data();
        return {
            status: data.status as LicenseStatus,
            licenseKey: data.licenseKey,
            activatedAt: (data.activatedAt as Timestamp)?.toDate() ?? null,
            expiresAt: (data.expiresAt as Timestamp)?.toDate() ?? null,
            planName: data.planName,
            instanceId: data.instanceId,
            lastChecked: (data.lastChecked as Timestamp)?.toDate() ?? null,
        };
    } catch {
        return null;
    }
}

async function writeLicenseToFirestore(uid: string, info: Partial<LicenseInfo & { lastChecked: any }>) {
    try {
        await setDoc(licenseDocRef(uid), {
            ...info,
            lastChecked: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.warn('[useLicense] Firestore write failed:', err);
    }
}

// ─── LemonSqueezy validation ──────────────────────────────────────────────────

interface LsValidateResponse {
    valid: boolean;
    error?: string;
    license_key?: {
        id: number;
        status: string;  // 'active' | 'inactive' | 'expired' | 'disabled'
        key: string;
        activation_usage: number;
        activation_limit: number;
        created_at: string;
        expires_at: string | null;
    };
    instance?: {
        id: string;
        name: string;
        created_at: string;
    };
    meta?: {
        product_name: string;
        variant_name: string;
    };
}

async function validateWithLemonSqueezy(
    licenseKey: string,
    instanceId?: string,
): Promise<{ ok: boolean; status: LicenseStatus; instanceId?: string; planName?: string; expiresAt?: Date | null }> {
    try {
        const body: Record<string, string> = { license_key: licenseKey };
        if (instanceId) body.instance_id = instanceId;

        const res = await fetch(`${LEMONSQUEEZY_API}/licenses/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(body),
        });

        const data: LsValidateResponse = await res.json();

        if (!res.ok || !data.valid) {
            const lsStatus = data.license_key?.status;
            if (lsStatus === 'expired') return { ok: false, status: 'expired' };
            return { ok: false, status: 'invalid' };
        }

        const lsStatus = data.license_key?.status;
        if (lsStatus !== 'active') {
            return { ok: false, status: lsStatus === 'expired' ? 'expired' : 'invalid' };
        }

        const expiresAt = data.license_key?.expires_at
            ? new Date(data.license_key.expires_at)
            : null; // null = lifetime

        return {
            ok: true,
            status: 'active',
            instanceId: data.instance?.id ?? instanceId,
            planName: data.meta?.variant_name ?? 'unknown',
            expiresAt,
        };
    } catch {
        // Network error
        return { ok: false, status: 'grace' };
    }
}

// ─── Activation (première fois) ───────────────────────────────────────────────

async function activateLicense(licenseKey: string, instanceName: string = 'ExtndApp') {
    try {
        const res = await fetch(`${LEMONSQUEEZY_API}/licenses/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ license_key: licenseKey, instance_name: instanceName }),
        });
        const data = await res.json();
        if (!res.ok || !data.activated) {
            return { ok: false, error: data.error ?? 'Activation failed' };
        }
        return {
            ok: true,
            instanceId: data.instance?.id as string,
            planName: data.meta?.variant_name as string,
            expiresAt: data.license_key?.expires_at ? new Date(data.license_key.expires_at) : null,
        };
    } catch {
        return { ok: false, error: 'Network error' };
    }
}

// ─── Trial check ─────────────────────────────────────────────────────────────

function isInTrial(creationTime?: string | null): boolean {
    if (!creationTime) return false;
    const created = new Date(creationTime).getTime();
    return Date.now() - created < TRIAL_DURATION_MS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLicense() {
    const { user } = useAuth();
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({ status: 'checking' });
    const [isActivating, setIsActivating] = useState(false);
    const [activationError, setActivationError] = useState<string | null>(null);

    // Needs-check: returns true if we should re-query LemonSqueezy
    const needsCheck = (lastChecked?: Date | null): boolean => {
        if (!lastChecked) return true;
        return Date.now() - lastChecked.getTime() > CHECK_INTERVAL_MS;
    };

    const refresh = useCallback(async () => {
        if (import.meta.env.DEV) {
            setLicenseInfo({ status: 'active', planName: 'lifetime' });
            return;
        }

        if (!user) {
            setLicenseInfo({ status: 'none' });
            return;
        }

        // 1. Load from Firestore
        const stored = await readLicenseFromFirestore(user.uid);

        // 2. If no stored license → check trial
        if (!stored || stored.status === 'none' || !stored.licenseKey) {
            if (isInTrial(user.metadata.creationTime)) {
                setLicenseInfo({ status: 'trial' });
            } else {
                setLicenseInfo({ status: 'none' });
            }
            return;
        }

        // 3. If stored and recent enough → use cache
        if (!needsCheck(stored.lastChecked)) {
            setLicenseInfo(stored);
            return;
        }

        // 4. Re-validate with LemonSqueezy
        setLicenseInfo({ ...stored, status: 'checking' });
        const result = await validateWithLemonSqueezy(stored.licenseKey!, stored.instanceId);

        if (result.status === 'grace') {
            // No network — check grace period
            const lastChecked = stored.lastChecked?.getTime() ?? 0;
            const gracePeriodOk = Date.now() - lastChecked < GRACE_PERIOD_MS;
            const graceStatus = gracePeriodOk
                ? (stored.status === 'active' ? 'grace' : stored.status)
                : 'expired';
            const newInfo = { ...stored, status: graceStatus as LicenseStatus };
            setLicenseInfo(newInfo);
            return;
        }

        const newInfo: LicenseInfo = {
            ...stored,
            status: result.status,
            expiresAt: result.expiresAt !== undefined ? result.expiresAt : stored.expiresAt,
            planName: result.planName ?? stored.planName,
            instanceId: result.instanceId ?? stored.instanceId,
        };
        setLicenseInfo(newInfo);
        await writeLicenseToFirestore(user.uid, newInfo);
    }, [user]);

    // Activate a new license key
    const activateLicenseKey = useCallback(async (licenseKey: string): Promise<boolean> => {
        if (!user) return false;
        setIsActivating(true);
        setActivationError(null);

        try {
            const result = await activateLicense(licenseKey, `ExtndApp_${user.uid.slice(0, 8)}`);

            if (!result.ok) {
                setActivationError(result.error ?? 'Clé invalide ou déjà utilisée.');
                return false;
            }

            const newInfo: LicenseInfo = {
                status: 'active',
                licenseKey,
                activatedAt: new Date(),
                expiresAt: result.expiresAt,
                planName: result.planName,
                instanceId: result.instanceId,
                lastChecked: new Date(),
            };
            setLicenseInfo(newInfo);
            await writeLicenseToFirestore(user.uid, newInfo);
            return true;
        } finally {
            setIsActivating(false);
        }
    }, [user]);

    // Deactivate (for testing / support)
    const deactivateLicense = useCallback(async () => {
        if (!user) return;
        const newInfo: LicenseInfo = { status: 'none' };
        setLicenseInfo(newInfo);
        await writeLicenseToFirestore(user.uid, newInfo);
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const isLicenseValid =
        licenseInfo.status === 'active' ||
        licenseInfo.status === 'trial' ||
        licenseInfo.status === 'grace';

    return {
        licenseInfo,
        isLicenseValid,
        isActivating,
        activationError,
        activateLicenseKey,
        deactivateLicense,
        refresh,
    };
}
