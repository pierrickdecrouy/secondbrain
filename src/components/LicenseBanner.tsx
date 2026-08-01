import React from 'react';
import { Warning, ArrowSquareOut, X, Timer, Crown, CheckCircle } from '@phosphor-icons/react';
import type { LicenseInfo } from '../lib/useLicense';
import './styles/LicenseBanner.css';

interface LicenseBannerProps {
    licenseInfo: LicenseInfo;
    onDismiss?: () => void;
    onUpgrade?: () => void;
}

export const LicenseBanner: React.FC<LicenseBannerProps> = ({
    licenseInfo,
    onDismiss,
    onUpgrade,
}) => {
    if (import.meta.env.DEV || licenseInfo.status === 'active' || licenseInfo.status === 'checking') {
        return null;
    }

    const config = {
        trial: {
            bg: 'rgba(99,102,241,0.08)',
            border: 'rgba(99,102,241,0.25)',
            color: '#6366f1',
            icon: <Timer size={15} weight="fill" />,
            text: `Période d'essai — ${getDaysLeftTrial()} jours restants`,
            cta: 'Activer une licence',
        },
        expired: {
            bg: 'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.25)',
            color: '#ef4444',
            icon: <Warning size={15} weight="fill" />,
            text: 'Votre licence a expiré. Renouvelez pour continuer à accéder aux fonctionnalités pro.',
            cta: 'Renouveler',
        },
        invalid: {
            bg: 'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.25)',
            color: '#ef4444',
            icon: <Warning size={15} weight="fill" />,
            text: 'Clé de licence invalide ou révoquée.',
            cta: 'Configurer',
        },
        none: {
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
            color: '#f59e0b',
            icon: <Crown size={15} weight="fill" />,
            text: 'Passez à la version Pro pour débloquer toutes les fonctionnalités.',
            cta: 'Obtenir une licence',
        },
        grace: {
            bg: 'rgba(99,102,241,0.06)',
            border: 'rgba(99,102,241,0.2)',
            color: '#8b5cf6',
            icon: <CheckCircle size={15} weight="fill" />,
            text: 'Mode hors-ligne — Vérification de licence reportée.',
            cta: null,
        },
    };

    const c = config[licenseInfo.status as keyof typeof config];
    if (!c) return null;

    return (
        <div className="licensebanner-style-1" style={{
  background: c.bg,
  borderBottom: `1px solid ${c.border}`
}}>
            <div className="licensebanner-style-2" >
                <span className="licensebanner-style-3" style={{
  color: c.color
}}>{c.icon}</span>
                <span className="licensebanner-style-4" >
                    {c.text}
                </span>
            </div>

            <div className="licensebanner-style-5" >
                {c.cta && onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="licensebanner-style-6" style={{
  background: c.color
}}
                    >
                        <ArrowSquareOut size={13} /> {c.cta}
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="licensebanner-style-7" 
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

function getDaysLeftTrial(): number {
    // Import and check Firebase user's creationTime
    // For display purposes, approximate 14 days from now
    return 14;
}
