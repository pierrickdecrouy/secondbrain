import React, { useState } from 'react';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { DataTab } from './settings/DataTab';
import { DictionaryTab } from './settings/DictionaryTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { IntelligenceTab } from './settings/IntelligenceTab';


export type SettingsTab = 'dictionary' | 'advanced' | 'stats' | 'appearance' | 'data' | 'intelligence' | 'profile' | 'subscription';

interface SettingsPageProps {
    onClose?: () => void;
}

const TAB_LABELS: Record<SettingsTab, string> = {
    dictionary: 'Dictionnaire',
    advanced: 'Paramètres avancés',
    stats: 'Statistiques',
    appearance: 'Apparence',
    data: 'Données',
    intelligence: 'Intelligence IA',
    profile: 'Profil',
    subscription: 'Abonnement',
};

/* ── Shared style tokens ─── */
const CARD_BG = '#111827';
const CARD_BORDER = '#1e293b';

const cardStyle: React.CSSProperties = {
    backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`,
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
};
const cardHeaderStyle: React.CSSProperties = {
    padding: '16px 24px', borderBottom: `1px solid ${CARD_BORDER}`,
    backgroundColor: 'rgba(22, 31, 48, 0.4)',
    display: 'flex', alignItems: 'center', gap: 8,
};
const cardBodyStyle: React.CSSProperties = { padding: 24 };
const bannerStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #111827, #1e293b)',
    border: '1px solid rgba(46, 62, 82, 0.4)',
    padding: 24, borderRadius: 16,
    position: 'relative', overflow: 'hidden', marginBottom: 24,
};

/* ── Profile Tab ─── */
const ProfileTab: React.FC = () => (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={bannerStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>Profil</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>Gérez vos informations personnelles et préférences de compte.</p>
            <div style={{ position: 'absolute', right: -32, top: -32, width: 256, height: 256, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        </div>

        {/* Avatar & Name */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={cardHeaderStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Informations générales</h3>
            </div>
            <div style={cardBodyStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(to top right, #10b981, #2dd4bf)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 28,
                        boxShadow: '0 0 24px rgba(16,185,129,0.15)',
                        flexShrink: 0,
                    }}>
                        E
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>Extnd. Admin</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Étudiant en pharmacie</div>
                        <div style={{ fontSize: 12, color: '#34d399', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                            Compte actif
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Nom d'utilisateur</label>
                        <input type="text" defaultValue="Extnd. Admin" style={{
                            width: '100%', backgroundColor: '#161f30', border: '1px solid #243242',
                            fontSize: 14, color: '#e2e8f0', borderRadius: 8, padding: '10px 16px',
                            outline: 'none', boxSizing: 'border-box',
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Email</label>
                        <input type="email" defaultValue="admin@extnd.app" style={{
                            width: '100%', backgroundColor: '#161f30', border: '1px solid #243242',
                            fontSize: 14, color: '#e2e8f0', borderRadius: 8, padding: '10px 16px',
                            outline: 'none', boxSizing: 'border-box',
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Spécialité</label>
                        <input type="text" defaultValue="Pharmacie" style={{
                            width: '100%', backgroundColor: '#161f30', border: '1px solid #243242',
                            fontSize: 14, color: '#e2e8f0', borderRadius: 8, padding: '10px 16px',
                            outline: 'none', boxSizing: 'border-box',
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Année d'études</label>
                        <select style={{
                            width: '100%', backgroundColor: '#161f30', border: '1px solid #243242',
                            fontSize: 14, color: '#e2e8f0', borderRadius: 8, padding: '10px 16px',
                            outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
                        }}>
                            <option>1ère année</option>
                            <option>2ème année</option>
                            <option>3ème année</option>
                            <option selected>4ème année</option>
                            <option>5ème année</option>
                            <option>6ème année</option>
                            <option>Internat</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: 24 }}>
                    <button style={{
                        padding: '10px 20px', backgroundColor: '#059669', color: 'white',
                        fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(5,150,105,0.1)',
                    }}>
                        Enregistrer les modifications
                    </button>
                </div>
            </div>
        </div>

        {/* Storage Info */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={cardHeaderStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Stockage local</h3>
            </div>
            <div style={cardBodyStyle}>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>
                    Vos données sont stockées localement dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe.
                </p>
                <div style={{ backgroundColor: '#0c111c', borderRadius: 8, padding: 16, border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Espace utilisé</span>
                        <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>~2.4 MB / 10 MB</span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: '24%', height: '100%', backgroundColor: '#10b981', borderRadius: 99, transition: 'width 500ms ease' }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/* ── Stats Tab ─── */
const StatsTab: React.FC = () => (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={bannerStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>Statistiques d'Usage</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>Analyse de la répartition de votre dictionnaire et volumétrie d'usage.</p>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
                { label: 'Total fiches', value: '—', sub: 'Toutes catégories' },
                { label: 'Abréviations', value: '—', sub: 'Personnalisées' },
                { label: 'Santé base', value: '99.8%', sub: '0 doublon' },
            ].map((kpi, i) => (
                <div key={i} style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: 24, borderRadius: 16 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{kpi.label}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{kpi.value}</span>
                        <span style={{ fontSize: 12, color: '#34d399', fontWeight: 500 }}>{kpi.sub}</span>
                    </div>
                </div>
            ))}
        </div>

        <div style={{ ...cardStyle }}>
            <div style={cardHeaderStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Activité récente</h3>
            </div>
            <div style={cardBodyStyle}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Les statistiques détaillées seront disponibles prochainement avec des graphiques de répartition et d'activité.</p>
            </div>
        </div>
    </div>
);

/* ── Placeholder Tab ─── */
const PlaceholderTab: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={bannerStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>{desc}</p>
        </div>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('dictionary');

    const handleClose = () => onClose ? onClose() : window.history.back();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dictionary':
                return <DictionaryTab />;
            case 'data':
                return <DataTab />;
            case 'appearance':
                return <AppearanceTab onCloseSettings={handleClose} />;
            case 'intelligence':
                return <IntelligenceTab />;
            case 'profile':
                return <ProfileTab />;
            case 'stats':
                return <StatsTab />;
            case 'advanced':
                return <PlaceholderTab title="Paramètres avancés" desc="Configuration avancée de l'application, raccourcis et comportements personnalisés." />;
            case 'subscription':
                return <PlaceholderTab title="Abonnement & Facturation" desc="Gérez votre plan, méthodes de paiement et historique de facturation." />;
            default:
                return null;
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: '#0b0f17',
            color: '#f1f5f9',
            fontFamily: "'Inter', sans-serif",
            display: 'flex', flexDirection: 'column',
            WebkitFontSmoothing: 'antialiased',
        }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100vh' }}>
                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                
                {/* CONTENT AREA */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0c111c' }}>
                    
                    {/* TOP BAR */}
                    <header style={{
                        height: 64, flexShrink: 0,
                        borderBottom: '1px solid #1e293b',
                        backgroundColor: 'rgba(15, 20, 32, 0.8)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 32px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#94a3b8' }}>
                            <span>Paramètres</span>
                            <svg style={{ width: 14, height: 14, color: '#475569' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{TAB_LABELS[activeTab]}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </span>
                                <input type="text" placeholder="Recherche rapide..." style={{
                                    backgroundColor: '#161f30', border: '1px solid #243242',
                                    fontSize: 12, color: '#e2e8f0',
                                    borderRadius: 8, padding: '8px 16px 8px 36px', width: 256,
                                    outline: 'none',
                                }} />
                            </div>
                            <button 
                                onClick={handleClose}
                                style={{ padding: 8, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
                                title="Fermer"
                            >
                                <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </header>

                    {/* DYNAMIC CONTENT */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
