import React, { useState } from 'react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { DataTab } from './settings/DataTab';
import { DictionaryTab } from './settings/DictionaryTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { IntelligenceTab } from './settings/IntelligenceTab';
import { RevisionTab } from './settings/RevisionTab';
import { S, SettingsCard, CardSection, CardBody, FieldLabel, SettingsInput, PrimaryButton, Badge, StatCard } from './settings/SettingsUI';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Avatar card */}
            <SettingsCard>
                <CardSection
                    title="Informations personnelles"
                    subtitle="Vos informations de compte Extnd."
                />
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        {photoURL ? (
                            <img
                                src={photoURL}
                                alt={displayName}
                                style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #2dd4bf)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: 24, flexShrink: 0,
                            }}>{initial}</div>
                        )}
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                                {displayName}
                            </div>
                            <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>{email}</div>
                            <div style={{ marginTop: 6 }}>
                                {user ? <Badge>Compte connecté</Badge> : <Badge>Mode hors-ligne</Badge>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                                style={{ opacity: 0.6 }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        {saved && <span style={{ fontSize: 13, color: S.primary, fontWeight: 500 }}>Enregistré ✓</span>}
                        <PrimaryButton
                            onClick={handleSave}
                            disabled={saving || !tempName.trim() || tempName === displayName}
                            style={{ opacity: (saving || !tempName.trim() || tempName === displayName) ? 0.5 : 1, cursor: (saving || !tempName.trim() || tempName === displayName) ? 'not-allowed' : 'pointer' }}
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
                    <p style={{ fontSize: 13, color: S.muted, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                        Vos données sont synchronisées avec Firebase si vous êtes connecté, et sauvegardées localement via IndexedDB.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: S.muted }}>Espace utilisé</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: S.primary }}>~2.4 Mo / 10 Mo</span>
                    </div>
                    <div style={{ height: 6, background: S.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: '24%', height: '100%', background: S.primary, borderRadius: 99 }} />
                    </div>
                </CardBody>
            </SettingsCard>
        </div>
    );
};

/* ── Stats Tab ────────────────────────────────────────────────────────────── */
const StatsTab: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <StatCard label="Total fiches" value="—" sub="Toutes catégories" />
            <StatCard label="Abréviations" value="—" sub="Personnalisées" />
            <StatCard label="Intégrité base" value="99.8%" color={S.primary} sub="0 doublon" />
        </div>

        <SettingsCard>
            <CardSection title="Activité récente" />
            <CardBody>
                <p style={{ fontSize: 13, color: S.muted, margin: 0, lineHeight: 1.7 }}>
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
        none:     { label: 'Aucune', color: S.muted, icon: <Crown size={16} /> },
        checking: { label: 'Vérification...', color: S.muted, icon: null },
    };

    const sd = statusDisplay[licenseInfo.status] ?? statusDisplay.none;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Current status card */}
            <SettingsCard>
                <CardSection title="Statut de la licence" subtitle="Votre abonnement Extnd." />
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: S.bg, borderRadius: 10, border: `1px solid ${S.border}`, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: sd.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sd.color, flexShrink: 0 }}>
                            {sd.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: S.text }}>Licence {sd.label}</div>
                            {licenseInfo.planName && <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{licenseInfo.planName}</div>}
                            {licenseInfo.expiresAt && <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>Expire le {licenseInfo.expiresAt.toLocaleDateString('fr-FR')}</div>}
                            {licenseInfo.expiresAt === null && licenseInfo.status === 'active' && <div style={{ fontSize: 12, color: '#10b981', marginTop: 2, fontWeight: 600 }}>∞ Licence à vie</div>}
                        </div>
                    </div>

                    {/* Plans */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                        {[
                            { name: 'Mensuel', price: '5,99 €', per: 'par mois', color: '#6366f1', popular: false },
                            { name: 'Annuel', price: '49 €', per: 'par an — économisez 30%', color: '#10b981', popular: true },
                            { name: 'Vie entière', price: '79 €', per: 'paiement unique', color: '#f59e0b', popular: false },
                        ].map(plan => (
                            <div key={plan.name} style={{ padding: '16px', border: `1.5px solid ${plan.popular ? plan.color : S.border}`, borderRadius: 10, position: 'relative', background: plan.popular ? plan.color + '06' : 'transparent' }}>
                                {plan.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>RECOMMANDÉ</div>}
                                <div style={{ fontSize: 13, fontWeight: 700, color: S.text }}>{plan.name}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: plan.color, margin: '6px 0 2px' }}>{plan.price}</div>
                                <div style={{ fontSize: 11, color: S.muted }}>{plan.per}</div>
                            </div>
                        ))}
                    </div>

                    <a
                        href="https://extnd.lemonsqueezy.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 9, background: S.primary, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
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
                        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9, color: '#059669', fontWeight: 600, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={16} weight="fill" /> Licence activée avec succès !
                        </div>
                    )}
                    {activationError && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Warning size={15} weight="fill" /> {activationError}
                        </div>
                    )}
                    <FieldLabel>Clé de licence</FieldLabel>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${S.border}`, borderRadius: 9, padding: '10px 14px', background: S.bg }}>
                            <Key size={16} style={{ color: S.muted, flexShrink: 0 }} />
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={e => setLicenseKey(e.target.value)}
                                placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, fontFamily: 'monospace', color: S.text }}
                            />
                        </div>
                        <PrimaryButton
                            onClick={handleActivate}
                            disabled={isActivating || !licenseKey.trim()}
                            style={{ flexShrink: 0, opacity: (isActivating || !licenseKey.trim()) ? 0.5 : 1, cursor: (isActivating || !licenseKey.trim()) ? 'not-allowed' : 'pointer' }}
                        >
                            {isActivating ? 'Vérification...' : 'Activer'}
                        </PrimaryButton>
                    </div>
                    {licenseInfo.licenseKey && (
                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: S.muted, fontFamily: 'monospace' }}>Clé active : {licenseInfo.licenseKey.slice(0, 8)}••••••••</span>
                            <button onClick={deactivateLicense} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
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
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: S.bg,
            color: S.text,
            fontFamily: "'Inter', system-ui, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            WebkitFontSmoothing: 'antialiased',
        }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Content */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: S.bg }}>
                    {/* Top bar */}
                    <header style={{
                        height: 56,
                        flexShrink: 0,
                        borderBottom: `1px solid ${S.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 28px',
                    }}>
                        {/* Breadcrumb */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <span style={{ color: S.muted }}>Paramètres</span>
                            <svg width="12" height="12" fill="none" stroke={S.muted} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            <span style={{ color: S.text, fontWeight: 600 }}>{TAB_LABELS[activeTab]}</span>
                        </div>

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            title="Fermer les paramètres"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, border: `1px solid ${S.border}`,
                                borderRadius: 8, background: 'transparent',
                                color: S.muted, cursor: 'pointer',
                                transition: 'color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = S.text; e.currentTarget.style.borderColor = S.muted; }}
                            onMouseLeave={e => { e.currentTarget.style.color = S.muted; e.currentTarget.style.borderColor = S.border; }}
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </header>

                    {/* Page header */}
                    <div style={{
                        padding: '24px 28px 0',
                        flexShrink: 0,
                    }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: S.text, margin: '0 0 2px 0', letterSpacing: '-0.3px' }}>
                            {TAB_LABELS[activeTab]}
                        </h1>
                        <div style={{ height: 1, background: S.border, marginTop: 16 }} />
                    </div>

                    {/* Tab content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }} className="custom-scrollbar">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
