import React from 'react';
import { Warning, ArrowSquareOut, X, Timer, Crown, CheckCircle } from '@phosphor-icons/react';
import type { LicenseInfo } from '../lib/useLicense';
import { getDaysLeftInTrial } from '../lib/useLicense';
import { useAuth } from '../context/AuthContext';

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
    const { user } = useAuth();

    // Ne rien afficher si actif ou en cours de vérification
    if (
        import.meta.env.DEV ||
        licenseInfo.status === 'active' ||
        licenseInfo.status === 'checking'
    ) {
        return null;
    }

    const daysLeft = licenseInfo.status === 'trial'
        ? getDaysLeftInTrial(user?.metadata.creationTime)
        : 0;

    const config = {
        trial: {
            bg: 'rgba(99,102,241,0.08)',
            border: 'rgba(99,102,241,0.25)',
            color: '#6366f1',
            icon: <Timer size={15} weight="fill" />,
            text: `Période d'essai — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`,
            cta: 'Demander l\'accès',
        },
        none: {
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
            color: '#f59e0b',
            icon: <Crown size={15} weight="fill" />,
            text: 'Période d\'essai expirée. Contactez-nous pour obtenir un accès.',
            cta: 'Obtenir l\'accès',
        },
    };

    const c = config[licenseInfo.status as keyof typeof config];
    if (!c) return null;

    return (
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{
            background: c.bg,
            borderBottom: `1px solid ${c.border}`
        }}>
            <div className="flex items-center gap-2">
                <span className="flex items-center" style={{ color: c.color }}>{c.icon}</span>
                <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
                    {c.text}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {c.cta && onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="flex items-center gap-[5px] px-3.5 py-[5px] rounded-lg border-none text-white font-semibold text-xs cursor-pointer"
                        style={{ background: c.color }}
                    >
                        <ArrowSquareOut size={13} /> {c.cta}
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400 flex p-1"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
