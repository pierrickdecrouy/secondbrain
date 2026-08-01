import React from 'react';
import type { SettingsTab } from '../SettingsPage';
import { S } from './SettingsUI';
import { useUIStore as useUI } from '../../store/useUIStore';
import './styles/SettingsSidebar.css';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
}

// ── Nav item ──────────────────────────────────────────────────────────────
const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    accent?: string;
}> = ({ label, icon, isActive, onClick, accent = S.primary }) => (
    <button
        onClick={onClick}
        className="settingssidebar-style-1" style={{
  fontWeight: isActive ? 700 : 500,
  backgroundColor: isActive ? `${accent}18` : 'transparent',
  color: isActive ? accent : S.muted
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
        <span className="settingssidebar-style-2" style={{
  opacity: isActive ? 1 : 0.6,
  color: isActive ? accent : 'inherit'
}}>{icon}</span>
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

// Section label separator
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <div className="settingssidebar-style-3" style={{
  color: S.muted
}}>
        {label}
    </div>
);

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    const { userName } = useUI();

    return (
        <aside className="settingssidebar-style-4" style={{
  background: S.surface,
  borderRight: `1px solid ${S.border}`
}}>
            {/* Header */}
            <div className="settingssidebar-style-5" style={{
  borderBottom: `1px solid ${S.border}`
}}>
                <img src="/Logo-linear.svg" alt="Extnd" className="settingssidebar-style-6"  />
                <div className="settingssidebar-style-7" style={{
  color: S.muted
}}>
                    Paramètres
                </div>
            </div>

            {/* Nav */}
            <nav className="settingssidebar-style-8" >
                <SectionLabel label="Contenu" />
                <NavItem label="Abréviations" isActive={activeTab === 'dictionary'} onClick={() => setActiveTab('dictionary')} icon={<Icon.Book />} accent="#6366f1" />
                <NavItem label="Intelligence IA" isActive={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} icon={<Icon.Brain />} accent="#8b5cf6" />

                <div className="settingssidebar-style-9"  />
                <SectionLabel label="Application" />
                <NavItem label="Apparence" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Icon.Palette />} accent="#0ea5e9" />
                <NavItem label="Révision" isActive={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={<Icon.Calendar />} accent="#f59e0b" />
                <NavItem label="Données" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Icon.Database />} accent="#10b981" />
                <NavItem label="Statistiques" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Icon.BarChart />} accent="#06b6d4" />

                <div className="settingssidebar-style-10"  />
                <SectionLabel label="Compte" />
                <NavItem label="Profil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Icon.User />} accent="#f43f5e" />
                <NavItem label="Abonnement" isActive={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} icon={<Icon.Card />} accent="#f59e0b" />
            </nav>

            {/* User footer */}
            <div className="settingssidebar-style-11" style={{
  borderTop: `1px solid ${S.border}`
}}>
                <div className="settingssidebar-style-12" >
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="settingssidebar-style-13" >
                    <div className="settingssidebar-style-14" style={{
  color: S.text
}}>
                        {userName}
                    </div>
                    <div className="settingssidebar-style-15" style={{
  color: S.muted
}}>
                        <span className="settingssidebar-style-16"  />
                        Connecté
                    </div>
                </div>
            </div>
        </aside>
    );
};
