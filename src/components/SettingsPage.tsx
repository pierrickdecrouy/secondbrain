// @ts-nocheck
import React, { useState } from 'react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { DataTab } from './settings/DataTab';
import { DictionaryTab } from './settings/DictionaryTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { IntelligenceTab } from './settings/IntelligenceTab';
import { RevisionTab } from './settings/RevisionTab';
import { LLMTab } from './settings/LLMTab';
import { SettingsCard, CardSection, CardBody, FieldLabel, SettingsInput, PrimaryButton, Badge, StatCard } from './settings/SettingsUI';
import { useUIStore as useUI } from '../store/useUIStore';
import { saveSettingAsync } from '../persistentSettings';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ArrowSquareOut, CheckCircle, Warning, Timer, Crown, Key, User, MagicWand, Shapes, Palette } from '@phosphor-icons/react';
import { useLicense, getDaysLeftInTrial } from '../lib/useLicense';
import { Avatar } from './Avatar';
import { DynamicIcon } from './DynamicIcon';
import type { AvatarConfig } from '../store/useUIStore';

export type SettingsTab = 'dictionary' | 'advanced' | 'stats' | 'appearance' | 'data' | 'intelligence' | 'profile' | 'subscription' | 'llm';

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
    llm: 'Modèles IA',
};

/* ── Profile Tab ─────────────────────────────────────────────────────────── */
const ProfileTab: React.FC = () => {
    const { user } = useAuth();
    const { userName, setUserName, avatarConfig, setAvatarConfig } = useUI();

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
                        <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl font-bold shrink-0 border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-sm">
                            <Avatar
                                config={avatarConfig}
                                userName={displayName}
                                photoURL={photoURL}
                                style={{ width: '100%', height: '100%', fontSize: '24px' }}
                            />
                        </div>
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

            {/* Avatar customization card */}
            <SettingsCard>
                <CardSection title="Personnalisation de l'avatar" subtitle="Choisissez comment vous apparaissez dans Extnd." />
                <CardBody>
                    <div className="flex flex-col gap-6">
                        
                        {/* Option: Automatique */}
                        <div>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-3">
                                <User size={16} /> Par défaut
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAvatarConfig({ type: 'auto' })}
                                    className={`w-14 h-14 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${avatarConfig.type === 'auto' ? 'border-teal-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                    title="Automatique"
                                >
                                    <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                        {photoURL ? (
                                            <img src={photoURL} alt="Google Photo" className="w-full h-full object-cover" />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Option: Gradients */}
                        <div>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-3">
                                <Palette size={16} /> Dégradés
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[
                                    'linear-gradient(135deg, #10b981, #14b8a6)', // emerald to teal
                                    'linear-gradient(135deg, #f43f5e, #fb923c)', // rose to orange
                                    'linear-gradient(135deg, #8b5cf6, #d946ef)', // violet to fuchsia
                                    'linear-gradient(135deg, #0ea5e9, #3b82f6)', // sky to blue
                                    'linear-gradient(135deg, #f59e0b, #eab308)', // amber to yellow
                                    'linear-gradient(135deg, #64748b, #334155)', // slate
                                ].map((gradient, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAvatarConfig({ type: 'gradient', value: gradient })}
                                        className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${avatarConfig.type === 'gradient' && avatarConfig.value === gradient ? 'border-teal-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                    >
                                        <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900" style={{ background: gradient }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Option: Icônes */}
                        <div>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-3">
                                <Shapes size={16} /> Icônes
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[
                                    { icon: 'Robot', color: '#8b5cf6' },
                                    { icon: 'Ghost', color: '#14b8a6' },
                                    { icon: 'Smiley', color: '#f59e0b' },
                                    { icon: 'Alien', color: '#10b981' },
                                    { icon: 'Ninja', color: '#ef4444' },
                                    { icon: 'Brain', color: '#ec4899' },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAvatarConfig({ type: 'icon', value: item.icon, color: item.color })}
                                        className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${avatarConfig.type === 'icon' && avatarConfig.value === item.icon ? 'border-teal-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                    >
                                        <div 
                                            className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center" 
                                            style={{ background: `${item.color}15`, color: item.color }}
                                        >
                                            <DynamicIcon name={item.icon} size={20} weight="fill" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Option: Illustrés (Dicebear) */}
                        <div>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-3">
                                <MagicWand size={16} /> Illustrés (Robots)
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[
                                    'extnd1', 'extnd2', 'extnd3', 'extnd4', 'extnd5', 'extnd6'
                                ].map((seed, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAvatarConfig({ type: 'dicebear', value: seed })}
                                        className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${avatarConfig.type === 'dicebear' && avatarConfig.value === seed ? 'border-teal-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                    >
                                        <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`} alt="bot" className="w-full h-full object-cover" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
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


/* ── Access / Subscription Tab ───────────────────────────────────────────── */
const LicenseTab: React.FC = () => {
    const { licenseInfo, daysLeftInTrial } = useLicense();
    const { user } = useAuth();

    const statusDisplay: Record<string, { label: string; color: string; icon: JSX.Element; desc: string }> = {
        active:   { label: 'Accès accordé', color: '#10b981', icon: <CheckCircle size={16} weight="fill" />, desc: licenseInfo.note ? `Bêta-testeur (${licenseInfo.note})` : 'Accès bêta actif' },
        trial:    { label: 'Essai gratuit', color: '#6366f1', icon: <Timer size={16} weight="fill" />, desc: `${daysLeftInTrial ?? 0} jour${(daysLeftInTrial ?? 0) > 1 ? 's' : ''} restant${(daysLeftInTrial ?? 0) > 1 ? 's' : ''}` },
        none:     { label: 'Accès expiré', color: '#f59e0b', icon: <Crown size={16} />, desc: 'Contactez-nous pour obtenir un accès' },
        checking: { label: 'Vérification...', color: '#64748b', icon: <Timer size={16} />, desc: '' },
    };

    const sd = statusDisplay[licenseInfo.status] ?? statusDisplay.none;

    return (
        <div className="flex flex-col gap-5">
            <SettingsCard>
                <CardSection title="Statut d'accès" subtitle="Votre accès à Extnd. Second Brain." />
                <CardBody>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-[10px] border border-slate-200 dark:border-slate-700 mb-4">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: sd.color + '15', color: sd.color }}>
                            {sd.icon}
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{sd.label}</div>
                            {sd.desc && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{sd.desc}</div>}
                            {user && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">UID : {user.uid}</div>}
                        </div>
                    </div>

                    {licenseInfo.status !== 'active' && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Pour obtenir un accès bêta, partagez votre UID (affiché ci-dessus) avec l'administrateur de l'application.
                        </p>
                    )}

                    {licenseInfo.status === 'active' && licenseInfo.grantedAt && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Accès accordé le {licenseInfo.grantedAt.toLocaleDateString('fr-FR')}.
                        </p>
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
            case 'llm':          return <LLMTab />;
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

