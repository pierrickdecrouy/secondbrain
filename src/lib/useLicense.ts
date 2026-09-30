/**
 * useAccess — Gestion d'accès via whitelist Firestore
 *
 * Flux :
 * 1. Vérifie si l'UID de l'utilisateur est dans /allowedUsers/{uid}
 * 2. Si oui → statut 'active' (accès Pro)
 * 3. Sinon → vérifie la période d'essai (14j depuis l'inscription)
 * 4. En dev → toujours 'active'
 *
 * Pour inviter un bêta-testeur :
 *   → Console Firebase > Firestore > allowedUsers > Ajouter un document
 *   → Document ID = UID Firebase de l'utilisateur
 *   → Champs : { granted: true, note: "Prénom", grantedAt: serverTimestamp() }
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LicenseStatus =
    | 'checking'  // En cours de vérification
    | 'active'    // Accès accordé (whitelist Firestore)
    | 'trial'     // Période d'essai (14j depuis l'inscription)
    | 'none';     // Pas d'accès

export interface LicenseInfo {
    status: LicenseStatus;
    planName?: string;
    note?: string;         // note libre (ex: "pote X")
    grantedAt?: Date | null;
    expiresAt?: Date | null;
    licenseKey?: string;   // conservé pour compatibilité UI
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInTrial(creationTime?: string | null): boolean {
    if (!creationTime) return false;
    return Date.now() - new Date(creationTime).getTime() < TRIAL_DURATION_MS;
}

export function getDaysLeftInTrial(creationTime?: string | null): number {
    if (!creationTime) return 0;
    const elapsed = Date.now() - new Date(creationTime).getTime();
    const remaining = TRIAL_DURATION_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLicense() {
    const { user } = useAuth();
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({ status: 'checking' });

    const refresh = useCallback(async () => {
        // En développement : toujours actif
        if (import.meta.env.DEV) {
            setLicenseInfo({ status: 'active', planName: 'dev' });
            return;
        }

        if (!user) {
            setLicenseInfo({ status: 'none' });
            return;
        }

        // Vérifier la whitelist Firestore
        try {
            const snap = await getDoc(doc(db, 'allowedUsers', user.uid));
            if (snap.exists() && snap.data()?.granted === true) {
                const data = snap.data();
                setLicenseInfo({
                    status: 'active',
                    planName: 'beta',
                    note: data.note ?? undefined,
                    grantedAt: data.grantedAt?.toDate?.() ?? null,
                    expiresAt: null,
                });
                return;
            }
        } catch {
            // Erreur Firestore réseau → tomber sur vérification trial
        }

        // Vérifier la période d'essai
        if (isInTrial(user.metadata.creationTime)) {
            setLicenseInfo({ status: 'trial', planName: 'trial' });
        } else {
            setLicenseInfo({ status: 'none' });
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const isLicenseValid =
        licenseInfo.status === 'active' ||
        licenseInfo.status === 'trial';

    const daysLeftInTrial = licenseInfo.status === 'trial'
        ? getDaysLeftInTrial(user?.metadata.creationTime)
        : null;

    // Stubs pour compatibilité avec les composants existants
    const activateLicenseKey = async (_key: string): Promise<boolean> => false;
    const deactivateLicense = async (): Promise<void> => { };

    return {
        licenseInfo,
        isLicenseValid,
        daysLeftInTrial,
        isActivating: false,
        activationError: null,
        activateLicenseKey,
        deactivateLicense,
        refresh,
    };
}
