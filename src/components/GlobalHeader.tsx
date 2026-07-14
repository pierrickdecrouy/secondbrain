import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlass, 
    Command, 
    GearSix, 
    Moon, 
    Sun, 
    Monitor, 
    DownloadSimple, 
    SignOut,
    List,
    CloudCheck,
    CloudArrowUp,
    WarningCircle
} from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';
import { useUIStore as useUI } from '../store/useUIStore';
import { useAuth } from '../context/AuthContext';
import { exportAllData } from '../storage';
import { PomodoroTimer } from './PomodoroTimer';

interface GlobalHeaderProps {
    isHomeSection: boolean;
    onNavigateSettings: () => void;
}
const SEARCH_PLACEHOLDERS = [
    "Rechercher une notion, un concept...",
    "Retrouver une fiche de révision...",
    "Que souhaitez-vous réviser aujourd'hui ?",
    "Tapez un mot-clé...",
    "Explorer vos connaissances..."
];

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isHomeSection, onNavigateSettings }) => {
    const navigate = useNavigate();
    
    const { darkMode, setThemeMode } = useTheme();
    const { 
        setSidebarOpen,
        isProfileMenuOpen, 
        setProfileMenuOpen, 
        setOmniboxOpen, 
        userName, 
        setActiveSection,
        syncStatus
    } = useUI();
    const { user, signInWithGoogle, logout } = useAuth();

    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        if (isHomeSection) return;
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isHomeSection]);

    return (
        <header className={`app-drag-region flex items-center justify-center py-5 min-h-[88px] z-50 shrink-0 w-full ${isHomeSection ? 'absolute top-0 left-0 border-none' : 'relative border-b border-slate-200/50 dark:border-slate-800/50'}`}>
            {!isHomeSection && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pointer-events-none" style={{ zIndex: -1 }} />
            )}
            <div className="w-full px-8 sm:px-12 flex items-center justify-between" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
            <div className="flex items-center gap-6">
                {!isHomeSection && (
                    <button 
                        className="app-no-drag flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer transition-colors shadow-sm" 
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir le menu"
                        title="Menu"
                    >
                        <List size={22} weight="regular" />
                    </button>
                )}
                <button
                    className="app-no-drag p-0 bg-transparent border-none cursor-pointer"
                    onClick={() => {
                        setActiveSection('dashboard');
                        navigate('/');
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            setActiveSection('dashboard');
                            navigate('/');
                        }
                    }}
                    aria-label="Aller au tableau de bord"
                >
                    <img 
                        src="/Logo-vertical.svg" 
                        alt="Extnd" 
                        className="transition-all duration-300 hover:opacity-80"
                        style={isHomeSection ? { height: '100px', marginLeft: '24px', marginTop: '24px' } : { height: '76px', marginLeft: '4px' }}
                    />
                </button>
            </div>

            {!isHomeSection && (
                <div className="app-no-drag flex-1 max-w-2xl mx-12 hidden sm:flex justify-center cursor-text">
                    <div 
                        className="relative flex items-center w-full group"
                        onClick={() => setOmniboxOpen(true)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOmniboxOpen(true); }}
                        role="button"
                        tabIndex={0}
                        aria-label="Rechercher"
                    >
                        <MagnifyingGlass size={24} className="absolute left-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" weight="bold" />
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-full text-[18px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 pointer-events-none"
                            style={{ padding: '14px 80px 14px 56px' }}
                            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]} 
                            readOnly
                        />
                        <span className="absolute right-4 flex items-center gap-1.5 text-[12px] font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Command size={14} weight="bold" /> K
                        </span>
                    </div>
                </div>
            )}

            <div className="app-no-drag flex items-center gap-5 ml-auto">
                
                {user && (
                    <div 
                        className="flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title={syncStatus === 'synced' ? 'Synchronisé avec le cloud' : syncStatus === 'pending' ? 'Synchronisation en cours...' : 'Erreur de synchronisation'}
                        style={isHomeSection ? { marginTop: '24px' } : {}}
                    >
                        {syncStatus === 'synced' && <CloudCheck size={18} weight="bold" className="text-emerald-500" />}
                        {syncStatus === 'pending' && <CloudArrowUp size={18} weight="bold" className="animate-pulse text-blue-500" />}
                        {syncStatus === 'error' && <WarningCircle size={18} weight="bold" className="text-red-500" />}
                    </div>
                )}

                <div style={isHomeSection ? { marginTop: '24px', marginLeft: '12px' } : { marginLeft: '8px' }}>
                    <PomodoroTimer />
                </div>

                <div 
                    className="relative transition-all duration-300"
                    style={isHomeSection ? { marginRight: '24px', marginTop: '24px' } : { marginLeft: '8px' }}
                >
                    <button 
                        className="p-0 bg-transparent cursor-pointer rounded-full" 
                        style={{ 
                            border: isProfileMenuOpen ? '2px solid var(--color-drug)' : '2px solid transparent', 
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                            transform: isProfileMenuOpen ? 'scale(0.95)' : 'scale(1)' 
                        }} 
                        onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                        aria-label="Mon compte"
                        title="Mon compte"
                    >
                        <div 
                            className="rounded-full flex items-center justify-center text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 transition-all duration-300"
                            style={isHomeSection ? { width: '48px', height: '48px', fontSize: '20px' } : { width: '48px', height: '48px', fontSize: '18px' }}
                        >
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                userName.charAt(0).toUpperCase()
                            )}
                        </div>
                    </button>
                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1050] animate-in fade-in duration-300 bg-slate-900/40 backdrop-blur-lg transition-all" 
                                aria-hidden="true"
                                onClick={() => setProfileMenuOpen(false)}></div>
                            <div 
                                className="absolute right-0 z-[1100] animate-in fade-in slide-in-from-top-4 duration-200"
                                style={{
                                    top: 'calc(100% + 12px)',
                                    width: 380,
                                    backgroundColor: darkMode ? '#0f1420' : '#ffffff',
                                    border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
                                    borderRadius: 24,
                                    boxShadow: darkMode ? '0 20px 50px rgba(0, 0, 0, 0.5)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ padding: '24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', flexShrink: 0, border: '1px solid rgba(16, 185, 129, 0.3)', overflow: 'hidden'
                                        }}>
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                userName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
                                            <span style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                                {user?.displayName || userName}
                                            </span>
                                            <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 14, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                                                {user?.email || 'Mode local (non connecté)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <button 
                                        className="profile-menu-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#334155', fontSize: 15, fontWeight: 500, transition: 'background-color 0.2s', textAlign: 'left' }}
                                        onClick={() => { onNavigateSettings(); setProfileMenuOpen(false); }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                            <GearSix size={20} weight="duotone" />
                                        </div>
                                        Paramètres du compte
                                    </button>

                                    <button 
                                        className="profile-menu-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#334155', fontSize: 15, fontWeight: 500, transition: 'background-color 0.2s', textAlign: 'left' }}
                                        onClick={() => { setThemeMode(darkMode ? 'light' : 'dark'); setProfileMenuOpen(false); }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                            {darkMode ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />} 
                                        </div>
                                        {darkMode ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'}
                                    </button>

                                    <button 
                                        className="profile-menu-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#334155', fontSize: 15, fontWeight: 500, transition: 'background-color 0.2s', textAlign: 'left' }}
                                        onClick={() => { setThemeMode('system'); setProfileMenuOpen(false); }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                            <Monitor size={20} weight="duotone" />
                                        </div>
                                        Thème Système
                                    </button>

                                    <button 
                                        className="profile-menu-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#334155', fontSize: 15, fontWeight: 500, transition: 'background-color 0.2s', textAlign: 'left' }}
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
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                            <DownloadSimple size={20} weight="duotone" />
                                        </div>
                                        Sauvegarder mes données
                                    </button>
                                </div>

                                <div style={{ padding: '12px', backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` }}>
                                    {!user ? (
                                        <button 
                                            className="profile-menu-item"
                                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: '#10b981', fontSize: 15, fontWeight: 700, transition: 'background-color 0.2s', textAlign: 'left', width: '100%' }}
                                            onClick={async () => {
                                                await signInWithGoogle();
                                                setProfileMenuOpen(false);
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                                <Command size={20} weight="duotone" />
                                            </div>
                                            Se connecter avec Google
                                        </button>
                                    ) : (
                                        <button 
                                            className="profile-menu-item"
                                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171', fontSize: 15, fontWeight: 700, transition: 'background-color 0.2s', textAlign: 'left', width: '100%' }}
                                            onClick={async () => {
                                                await logout();
                                                setProfileMenuOpen(false);
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                                                <SignOut size={20} weight="duotone" />
                                            </div>
                                            Déconnexion
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            </div>
        </header>
    );
};
