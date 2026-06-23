import React from 'react';
import type { SettingsTab } from '../SettingsPage';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
}

interface NavItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
    <li style={{ listStyle: 'none' }}>
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isActive ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textAlign: 'left',
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#161f30';
                    e.currentTarget.style.color = '#e2e8f0';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                }
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
    </li>
);

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <aside style={{
            width: 288, flexShrink: 0,
            backgroundColor: '#0f1420',
            borderRight: '1px solid #1e293b',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Logo / Brand Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <img src="/Logo-vertical.svg" alt="Extnd Logo" style={{ height: 80, width: 'auto', alignSelf: 'flex-start' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Paramètres</span>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Section DICTIONNAIRE */}
                <div>
                    <div style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Dictionnaire
                    </div>
                    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <NavItem 
                            label="Vos abréviations"
                            isActive={activeTab === 'dictionary'}
                            onClick={() => setActiveTab('dictionary')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>}
                        />
                        <NavItem 
                            label="Paramètres avancés"
                            isActive={activeTab === 'advanced'}
                            onClick={() => setActiveTab('advanced')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                        />
                    </ul>
                </div>

                {/* Section GÉNÉRAL */}
                <div>
                    <div style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Général
                    </div>
                    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <NavItem 
                            label="Statistiques"
                            isActive={activeTab === 'stats'}
                            onClick={() => setActiveTab('stats')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                        />
                        <NavItem 
                            label="Apparence"
                            isActive={activeTab === 'appearance'}
                            onClick={() => setActiveTab('appearance')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>}
                        />
                        <NavItem 
                            label="Données"
                            isActive={activeTab === 'data'}
                            onClick={() => setActiveTab('data')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>}
                        />
                        <NavItem 
                            label="Intelligence IA"
                            isActive={activeTab === 'intelligence'}
                            onClick={() => setActiveTab('intelligence')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>}
                        />
                    </ul>
                </div>

                {/* Section COMPTE */}
                <div>
                    <div style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Compte
                    </div>
                    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <NavItem 
                            label="Profil"
                            isActive={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                        />
                        <NavItem 
                            label="Abonnement"
                            isActive={activeTab === 'subscription'}
                            onClick={() => setActiveTab('subscription')}
                            icon={<svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>}
                        />
                    </ul>
                </div>
            </nav>

            {/* Connection Status Footer */}
            <div style={{ padding: 16, borderTop: '1px solid #1e293b', backgroundColor: '#0c101a', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Extnd. Admin</div>
                    <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                        Connecté
                    </div>
                </div>
            </div>
        </aside>
    );
};
