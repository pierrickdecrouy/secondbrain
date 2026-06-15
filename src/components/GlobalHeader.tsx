import React, { useState } from 'react';
import { 
    MagnifyingGlass, 
    Command, 
    Plus, 
    PencilSimple, 
    GearSix, 
    Moon, 
    Sun, 
    Monitor, 
    DownloadSimple, 
    SignOut,
    List
} from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';
import { useUI } from '../context/UIContext';
import { exportAllData } from '../storage';
import { saveSettingAsync } from '../persistentSettings';

interface GlobalHeaderProps {
    isHomeSection: boolean;
    onNavigateSettings: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isHomeSection, onNavigateSettings }) => {
    
    const { darkMode, setThemeMode } = useTheme();
    const { 
        setSidebarOpen,
        isProfileMenuOpen, 
        setProfileMenuOpen, 
        setOmniboxOpen, 
        userName, 
        setUserName, 
        setAddDataMode 
    } = useUI();

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    return (
        <header className={`global-header app-drag-region ${isHomeSection ? 'global-header-home' : ''}`}>
            <div className="global-header-brand">
                <button className="workspace-btn app-no-drag global-header-menu-btn" onClick={() => setSidebarOpen(true)}>
                    <List size={24} weight="bold" />
                </button>
                <img src="/Logo-linear.svg" alt="Extnd" className="brand-logo-img" style={{ height: '32px' }} />
            </div>

            {!isHomeSection && (
                <div className="global-header-search app-no-drag">
                    <div className="search-omnibox">
                        <MagnifyingGlass size={16} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une carte, une pathologie..." 
                            readOnly
                            onFocus={(e) => {
                                e.target.blur();
                                setOmniboxOpen(true);
                            }}
                        />
                        <span className="search-shortcut">
                            <Command size={10} weight="bold" /> K
                        </span>
                    </div>
                </div>
            )}

            <div className="global-header-actions app-no-drag">
                {!isHomeSection && (
                    <button className="header-btn-primary" onClick={() => setAddDataMode('create')}>
                        <Plus size={16} weight="bold" /> <span className="hidden sm:inline">Nouvelle fiche</span>
                    </button>
                )}
                
                <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    <button 
                        className="header-icon-btn" 
                        style={{ 
                            padding: 0, 
                            border: isProfileMenuOpen ? '2px solid var(--color-drug)' : '2px solid transparent', 
                            background: 'transparent',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                            transform: isProfileMenuOpen ? 'scale(0.95)' : 'scale(1)' 
                        }} 
                        onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                        title="Mon compte"
                    >
                        <div style={{
                            width: '100%', height: '100%', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-drug)', fontWeight: '700', fontSize: '1rem',
                            background: 'rgba(5, 150, 105, 0.1)'
                        }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </button>
                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1050] animate-in fade-in duration-150" 
                                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }} 
                                onClick={() => setProfileMenuOpen(false)}></div>
                            <div className="absolute right-0 top-[calc(100%+8px)] z-[1100] animate-in fade-in slide-in-from-top-2 duration-150"
                                style={{ 
                                    width: '280px',
                                    background: 'var(--color-surface)', 
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    boxShadow: 'var(--shadow-xl)',
                                    overflow: 'hidden'
                                }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                                    {isEditingName ? (
                                        <input 
                                            autoFocus
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={() => {
                                                const newName = tempName.trim() || 'Utilisateur';
                                                setUserName(newName);
                                                saveSettingAsync('pharmabrain_username_v1', newName);
                                                setIsEditingName(false);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const newName = tempName.trim() || 'Utilisateur';
                                                    setUserName(newName);
                                                    saveSettingAsync('pharmabrain_username_v1', newName);
                                                    setIsEditingName(false);
                                                }
                                            }}
                                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-drug)', borderRadius: '8px', color: 'var(--color-text)', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500', padding: '8px 12px', boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%',
                                                background: 'var(--color-drug)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: '700', fontSize: '18px',
                                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                                                flexShrink: 0
                                            }}>
                                                {userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="cursor-pointer transition-colors" style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }} onClick={() => { setIsEditingName(true); setTempName(userName); }} title="Modifier mon nom">
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</span>
                                                    <PencilSimple size={14} weight="bold" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
                                                </p>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>pierrick@extnd.app</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-text)', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', margin: '2px 0' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-drug)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                                            onClick={() => { onNavigateSettings(); setProfileMenuOpen(false); }}>
                                        <GearSix size={18} weight="duotone" /> <span style={{ fontWeight: 500 }}>Paramètres du compte</span>
                                    </button>
                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-text)', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', margin: '2px 0' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-physio)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                                            onClick={() => { setThemeMode(darkMode ? 'light' : 'dark'); setProfileMenuOpen(false); }}>
                                        {darkMode ? <Sun size={18} weight="duotone" /> : <Moon size={18} weight="duotone" />} 
                                        <span style={{ fontWeight: 500 }}>{darkMode ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'}</span>
                                    </button>
                                </div>
                                <div style={{ padding: '4px', borderBottom: '1px solid var(--color-border)' }}>
                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-text)', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            onClick={() => { setThemeMode('system'); setProfileMenuOpen(false); }}>
                                        <Monitor size={18} weight="duotone" /> <span style={{ fontWeight: 500 }}>Thème Système</span>
                                    </button>
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-text)', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', margin: '2px 0' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-data)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                                            onClick={async () => { 
                                                const data = await exportAllData();
                                                const blob = new Blob([data], { type: "application/json" });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `pharma-brain-full-backup-${new Date().toISOString().split('T')[0]}.json`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                URL.revokeObjectURL(url);
                                                setProfileMenuOpen(false); 
                                            }}>
                                        <DownloadSimple size={18} weight="duotone" /> <span style={{ fontWeight: 500 }}>Sauvegarder mes données</span>
                                    </button>
                                </div>
                                <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)' }}>
                                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-patho)', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            onClick={() => setProfileMenuOpen(false)}>
                                        <SignOut size={18} weight="duotone" /> <span style={{ fontWeight: 600 }}>Déconnexion</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
