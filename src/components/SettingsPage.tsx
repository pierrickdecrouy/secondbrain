import React, { useState } from 'react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { DataTab } from './settings/DataTab';
import { DictionaryTab } from './settings/DictionaryTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { IntelligenceTab } from './settings/IntelligenceTab';
import { RevisionTab } from './settings/RevisionTab';
import { SettingsCard, CardSection, CardBody, FieldLabel, SettingsInput, PrimaryButton, Badge, StatCard } from './settings/SettingsUI';
import { useUIStore as useUI } from '../store/useUIStore';
import { saveSettingAsync } from '../persistentSettings';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useLicense } from '../lib/useLicense';
import { ArrowSquareOut, CheckCircle, Warning, Timer, Crown, Key } from '@phosphor-icons/react';

export type SettingsTab = 'dictionary' | 'advanced' | 'stats' | 'appearance' | 'data' | 'intelligence' | 'profile' | 'subscription';

interface SettingsPageProps {
    onClose?: () => void;
}

const TAB_LABELS: Record<SettingsTab, string> = {
    dictionary: 'Abréviations',
    advanced: 'Révision',
    stats: 'Statistiques',
    appearance: 'Apparence',
    data: 'Données',
    intelligence: 'Intelligence IA',
    profile: 'Profil',
    subscription: 'Abonnement',
}/* ── Profile Tab ─────────────────────────────────────────────────────────── */
const ProfileTab: React.FC = () => {
    const { user } = useAuth();
    const { userName, setUserName } = useUI();

    // Source of truth: Firebase user if connected, localStorage otherwise
    const initialName = user?.displayName || userName || '';
    const [tempName, setTempName] = useState(initialName);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const newName = tempName.trim() || 'Utilisateur';
        setSaving(true);
        try {
            if (user && auth.currentUser) {
                // Update Firebase Auth profile
                await updateProfile(auth.currentUser, { displayName: newName });
            }
            // Also keep localStorage in sync for offline fallback
            setUserName(newName);
            saveSettingAsync('pharmabrain_username_v1', newName);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error('Erreur mise à jour profil:', err);
        } finally {
            setSaving(false);
        }
    };

    // Avatar: photo Google si dispo, sinon initiale
    const displayName = user?.displayName || userName || 'Utilisateur';
    const email = user?.email || '—';
    const photoURL = user?.photoURL;
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div className="flex flex-col gap-5">
            {/* Avatar card */}
            <SettingsCard>
                <CardSection
                    title="Informations personnelles"
                    subtitle="Vos informations de compte Extnd."
                />
                <CardBody>
                    <div className="flex items-center gap-4 mb-6">
                        {photoURL ? (
                            <img
                                src={photoURL}
                                alt={displayName}
                                className="w-[60px] h-[60px] rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
                                {initial}
                            </div>
                        )}
                        <div>
                            <div className="text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                                {displayName}
                            </div>
                            <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{email}</div>
                            <div className="mt-1.5">
                                {user ? <Badge>Compte connecté</Badge> : <Badge>Mode hors-ligne</Badge>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Nom d'affichage</FieldLabel>
                            <SettingsInput
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Votre prénom"
                            />
                        </div>
                        <div>
                            <FieldLabel>Email</FieldLabel>
                            <SettingsInput
                                type="email"
                                value={email}
                                disabled
                                className="opacity-60"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end items-center gap-3">
                        {saved && <span className="text-[13px] text-teal-600 dark:text-teal-400 font-medium">Enregistré ✓</span>}
                        <PrimaryButton
                            onClick={handleSave}
                            disabled={saving || !tempName.trim() || tempName === displayName}
                            className={(saving || !tempName.trim() || tempName === displayName) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        >
                            {saving ? 'Sauvegarde...' : 'Enregistrer'}
                        </PrimaryButton>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Storage card */}
            <SettingsCard>
                <CardSection title="Stockage local" subtitle="Données enregistrées dans votre navigateur." />
                <CardBody>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Vos données sont synchronisées avec Firebase si vous êtes connecté, et sauvegardées localement via IndexedDB.
                    </p>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[13px] text-slate-500 dark:text-slate-400">Espace utilisé</span>
                        <span className="text-[13px] font-semibold text-teal-600 dark:text-teal-400">~2.4 Mo / 10 Mo</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="w-[24%] h-full bg-teal-600 dark:bg-teal-500 rounded-full" />
                    </div>
                </CardBody>
            </SettingsCard>
        </div>
    );
};

/* ── Stats Tab ────────────────────────────────────────────────────────────── */
const StatsTab: React.FC = () => (
    <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total fiches" value="—" sub="Toutes catégories" />
            <StatCard label="Abréviations" value="—" sub="Personnalisées" />
            <StatCard label="Intégrité base" value="99.8%" color="#10b981" sub="0 doublon" />
        </div>

        <SettingsCard>
            <CardSection title="Activité récente" />
            <CardBody>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                    Les graphiques d'activité et de répartition seront disponibles dans une prochaine mise à jour.
                </p>
            </CardBody>
        </SettingsCard>
    </div>
);


/* ── License / Subscription Tab ──────────────────────────────────────────── */
const LicenseTab: React.FC = () => {
    const { licenseInfo, activateLicenseKey, deactivateLicense, isActivating, activationError } = useLicense();
    const [licenseKey, setLicenseKey] = useState('');
    const [activationSuccess, setActivationSuccess] = useState(false);

    const handleActivate = async () => {
        const ok = await activateLicenseKey(licenseKey.trim());
        if (ok) {
            setActivationSuccess(true);
            setLicenseKey('');
            setTimeout(() => setActivationSuccess(false), 4000);
        }
    };

    const statusDisplay = {
        active:   { label: 'Active', color: '#10b981', icon: <CheckCircle size={16} weight="fill" /> },
        trial:    { label: 'Essai gratuit', color: '#6366f1', icon: <Timer size={16} weight="fill" /> },
        grace:    { label: 'Hors-ligne (cache)', color: '#8b5cf6', icon: <CheckCircle size={16} weight="fill" /> },
        expired:  { label: 'Expirée', color: '#ef4444', icon: <Warning size={16} weight="fill" /> },
        invalid:  { label: 'Invalide', color: '#ef4444', icon: <Warning size={16} weight="fill" /> },
        none:     { label: 'Aucune', color: '#64748b', icon: <Crown size={16} /> },
        checking: { label: 'Vérification...', color: '#64748b', icon: null },
    };

    const sd = statusDisplay[licenseInfo.status] ?? statusDisplay.none;

    return (
        <div className="flex flex-col gap-5">

            {/* Current status card */}
            <SettingsCard>
                <CardSection title="Statut de la licence" subtitle="Votre abonnement Extnd." />
                <CardBody>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-[10px] border border-slate-200 dark:border-slate-700 mb-5">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: sd.color + '15', color: sd.color }}>
                            {sd.icon}
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Licence {sd.label}</div>
                            {licenseInfo.planName && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{licenseInfo.planName}</div>}
                            {licenseInfo.expiresAt && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Expire le {licenseInfo.expiresAt.toLocaleDateString('fr-FR')}</div>}
                            {licenseInfo.expiresAt === null && licenseInfo.status === 'active' && <div className="text-[12px] text-[#10b981] mt-0.5 font-semibold">∞ Licence à vie</div>}
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { name: 'Mensuel', price: '5,99 €', per: 'par mois', color: '#14b8a6', popular: false },
                            { name: 'Annuel', price: '49 €', per: 'par an — économisez 30%', color: '#10b981', popular: true },
                            { name: 'Vie entière', price: '79 €', per: 'paiement unique', color: '#f59e0b', popular: false },
                        ].map(plan => (
                            <div key={plan.name} className="p-4 rounded-[10px] relative" style={{ border: `1.5px solid ${plan.popular ? plan.color : '#e2e8f0'}`, background: plan.popular ? plan.color + '06' : 'transparent' }}>
                                {plan.popular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-2.5 py-[3px] rounded-full" style={{ background: plan.color }}>RECOMMANDÉ</div>}
                                <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{plan.name}</div>
                                <div className="text-[22px] font-extrabold mt-1.5 mb-0.5" style={{ color: plan.color }}>{plan.price}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{plan.per}</div>
                            </div>
                        ))}
                    </div>

                    <a
                        href={import.meta.env.VITE_LEMONSQUEEZY_STORE_URL || "https://extnd.lemonsqueezy.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 dark:bg-teal-500 text-white font-bold text-sm no-underline"
                    >
                        <ArrowSquareOut size={16} /> Acheter sur LemonSqueezy
                    </a>
                </CardBody>
            </SettingsCard>

            {/* Activation */}
            <SettingsCard>
                <CardSection title="Activer une clé de licence" subtitle="Entrez la clé reçue par email après achat." />
                <CardBody>
                    {activationSuccess && (
                        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-600 font-semibold text-[13px] mb-4 flex items-center gap-2">
                            <CheckCircle size={16} weight="fill" /> Licence activée avec succès !
                        </div>
                    )}
                    {activationError && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 text-[13px] mb-4 flex items-center gap-2">
                            <Warning size={15} weight="fill" /> {activationError}
                        </div>
                    )}
                    <FieldLabel>Clé de licence</FieldLabel>
                    <div className="flex gap-2.5 items-center">
                        <div className="flex-1 flex items-center gap-2.5 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950">
                            <Key size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={e => setLicenseKey(e.target.value)}
                                placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                                className="border-none bg-transparent outline-none w-full text-[13px] font-mono text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <PrimaryButton
                            onClick={handleActivate}
                            disabled={isActivating || !licenseKey.trim()}
                            className={`shrink-0 ${isActivating || !licenseKey.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {isActivating ? 'Vérification...' : 'Activer'}
                        </PrimaryButton>
                    </div>
                    {licenseInfo.licenseKey && (
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 font-mono">Clé active : {licenseInfo.licenseKey.slice(0, 8)}••••••••</span>
                            <button onClick={deactivateLicense} className="text-[12px] text-red-500 bg-transparent border-none cursor-pointer font-medium">
                                Désactiver
                            </button>
                        </div>
                    )}
                </CardBody>
            </SettingsCard>
        </div>
    );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

    const handleClose = () => onClose ? onClose() : window.history.back();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dictionary':   return <DictionaryTab />;
            case 'data':         return <DataTab />;
            case 'appearance':   return <AppearanceTab onCloseSettings={handleClose} />;
            case 'intelligence': return <IntelligenceTab />;
            case 'advanced':     return <RevisionTab />;
            case 'profile':      return <ProfileTab />;
            case 'stats':        return <StatsTab />;
            case 'subscription': return <LicenseTab />;
            default:             return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Content */}
                <main
                    className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px]"
                    
                >
                    {/* Top bar */}
                    <header
                        className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 bg-white dark:bg-slate-900"
                        
                    >
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Paramètres</span>
                            <svg width="12" height="12" fill="none" className="stroke-slate-500 dark:stroke-slate-400 stroke-2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            <span className="text-slate-900 dark:text-slate-100 font-semibold">{TAB_LABELS[activeTab]}</span>
                        </div>

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            title="Fermer les paramètres"
                            className="flex items-center justify-center w-8 h-8 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-slate-500 dark:text-slate-400 cursor-pointer transition-colors hover:text-slate-900 dark:text-slate-100 hover:border-slate-500 dark:border-slate-400"
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </header>

                    {/* Page header */}
                    <div className="pt-8 px-8 pb-2 shrink-0">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-1 tracking-tight">
                            {TAB_LABELS[activeTab]}
                        </h1>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 mt-5" />
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 pb-12 custom-scrollbar">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;

