import React, { useState } from 'react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { DataTab } from './settings/DataTab';
import { DictionaryTab } from './settings/DictionaryTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { IntelligenceTab } from './settings/IntelligenceTab';
import { RevisionTab } from './settings/RevisionTab';
import { S, SettingsCard, CardSection, CardBody, FieldLabel, SettingsInput, SettingsSelect, PrimaryButton, Badge, StatCard } from './settings/SettingsUI';
import { useUI } from '../context/UIContext';
import { saveSettingAsync } from '../persistentSettings';

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
};

/* ── Profile Tab ──────────────────────────────────────────────────────────── */
const ProfileTab: React.FC = () => {
    const { userName, setUserName } = useUI();
    const [tempName, setTempName] = useState(userName);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        const newName = tempName.trim() || 'Utilisateur';
        setUserName(newName);
        saveSettingAsync('pharmabrain_username_v1', newName);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

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
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #2dd4bf)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 800, fontSize: 24, flexShrink: 0,
                        }}>{userName.charAt(0).toUpperCase()}</div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                                {userName}
                            </div>
                            <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>Étudiant en pharmacie</div>
                            <div style={{ marginTop: 6 }}>
                                <Badge>Compte actif</Badge>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <FieldLabel>Nom d'utilisateur</FieldLabel>
                            <SettingsInput type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel>Email</FieldLabel>
                            <SettingsInput type="email" defaultValue="admin@extnd.app" disabled style={{ opacity: 0.6 }} />
                        </div>
                        <div>
                            <FieldLabel>Spécialité</FieldLabel>
                            <SettingsInput type="text" defaultValue="Pharmacie" disabled style={{ opacity: 0.6 }} />
                        </div>
                        <div>
                            <FieldLabel>Année d'études</FieldLabel>
                            <SettingsSelect defaultValue="4" disabled style={{ opacity: 0.6 }}>
                                {['1ère','2ème','3ème','4ème','5ème','6ème','Internat'].map((y, i) => (
                                    <option key={i} value={i+1}>{y} année</option>
                                ))}
                            </SettingsSelect>
                        </div>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        {saved && <span style={{ fontSize: 13, color: S.primary, fontWeight: 500 }}>Enregistré !</span>}
                        <PrimaryButton 
                            onClick={handleSave} 
                            disabled={!tempName.trim() || tempName === userName}
                            style={{ opacity: (!tempName.trim() || tempName === userName) ? 0.5 : 1, cursor: (!tempName.trim() || tempName === userName) ? 'not-allowed' : 'pointer' }}
                        >
                            Enregistrer
                        </PrimaryButton>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Storage card */}
            <SettingsCard>
                <CardSection title="Stockage local" subtitle="Données enregistrées dans votre navigateur." />
                <CardBody>
                    <p style={{ fontSize: 13, color: S.muted, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                        Vos données restent sur votre appareil. Aucune information n'est transmise à un serveur externe.
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

/* ── Placeholder Tab ──────────────────────────────────────────────────────── */
const PlaceholderTab: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <SettingsCard>
        <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: S.primaryDim, color: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🚧
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: S.text }}>{title}</div>
                <div style={{ fontSize: 13, color: S.muted, maxWidth: 340, lineHeight: 1.6 }}>{desc}</div>
            </div>
        </CardBody>
    </SettingsCard>
);

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
            case 'subscription': return <PlaceholderTab title="Abonnement" desc="Gérez votre plan, méthodes de paiement et historique de facturation." />;
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
