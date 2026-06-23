import React from 'react';
import type { SettingsTab } from '../SettingsPage';
import { S } from './SettingsUI';
import { useUI } from '../../context/UIContext';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
}

// ── Nav group ─────────────────────────────────────────────────────────────
const NavGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: S.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 10px',
            marginBottom: 4,
        }}>
            {label}
        </div>
        {children}
    </div>
);

// ── Nav item ──────────────────────────────────────────────────────────────
const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 10px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            border: 'none',
            backgroundColor: isActive ? S.primaryDim : 'transparent',
            color: isActive ? S.primary : S.muted,
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            textAlign: 'left',
        }}
        onMouseEnter={e => {
            if (!isActive) {
                e.currentTarget.style.backgroundColor = S.surfaceHover;
                e.currentTarget.style.color = S.text;
            }
        }}
        onMouseLeave={e => {
            if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = S.muted;
            }
        }}
    >
        <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{icon}</span>
        <span>{label}</span>
    </button>
);

// ── Phosphor-style inline SVG icons ──────────────────────────────────────
const Icon = {
    Book: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    Gear: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    Palette: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>,
    Database: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>,
    Brain: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    Calendar: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    BarChart: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    User: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    Card: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
};

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    const { userName } = useUI();

    return (
        <aside style={{
            width: 240,
            flexShrink: 0,
            background: S.surface,
            borderRight: `1px solid ${S.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 16px 16px',
                borderBottom: `1px solid ${S.border}`,
            }}>
                <img src="/Logo-linear.svg" alt="Extnd" style={{ height: 28, width: 'auto' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 10 }}>
                    Paramètres
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <NavGroup label="Contenu">
                    <NavItem label="Abréviations" isActive={activeTab === 'dictionary'} onClick={() => setActiveTab('dictionary')} icon={<Icon.Book />} />
                    <NavItem label="Intelligence IA" isActive={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} icon={<Icon.Brain />} />
                </NavGroup>

                <NavGroup label="Application">
                    <NavItem label="Apparence" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Icon.Palette />} />
                    <NavItem label="Révision" isActive={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={<Icon.Calendar />} />
                    <NavItem label="Données" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Icon.Database />} />
                    <NavItem label="Statistiques" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Icon.BarChart />} />
                </NavGroup>

                <NavGroup label="Compte">
                    <NavItem label="Profil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Icon.User />} />
                    <NavItem label="Abonnement" isActive={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} icon={<Icon.Card />} />
                </NavGroup>
            </nav>

            {/* User footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${S.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #2dd4bf)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {userName}
                    </div>
                    <div style={{ fontSize: 11, color: S.muted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.primary, display: 'inline-block' }} />
                        Connecté
                    </div>
                </div>
            </div>
        </aside>
    );
};
