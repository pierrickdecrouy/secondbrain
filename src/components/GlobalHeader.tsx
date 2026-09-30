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
    CloudCheck,
    CloudArrowUp,
    WarningCircle,
    ArrowsClockwise
} from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';
import { useUIStore as useUI } from '../store/useUIStore';
import { useAuth } from '../context/AuthContext';
import { exportAllData } from '../storage';
import { PomodoroTimer } from './PomodoroTimer';
import { Avatar } from './Avatar';
import { syncQueue } from '../services/syncQueue';

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
        isProfileMenuOpen, 
        setProfileMenuOpen, 
        setOmniboxOpen, 
        userName, 
        syncStatus,
        lastSyncAt,
        lastSyncError,
        pendingSyncTasks,
        sidebarOpen,
        avatarConfig
    } = useUI();
    const { user, signInWithGoogle, logout } = useAuth();

    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [nowTs, setNowTs] = useState(() => Date.now());

    useEffect(() => {
        if (isHomeSection) return;
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isHomeSection]);

    useEffect(() => {
        const interval = setInterval(() => setNowTs(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getSyncLabel = () => {
        if (syncStatus === 'pending') {
            return pendingSyncTasks > 0
                ? `Synchronisation en cours (${pendingSyncTasks} en attente)`
                : 'Synchronisation en cours...';
        }
        if (syncStatus === 'error') {
            return lastSyncError || 'Échec de synchronisation. Cliquez pour réessayer.';
        }
        if (!lastSyncAt) return 'Synchronisé avec le cloud';
        const deltaMinutes = Math.max(0, Math.floor((nowTs - lastSyncAt) / 60000));
        if (deltaMinutes < 1) return 'Synchronisé à l’instant';
        if (deltaMinutes < 60) return `Synchronisé il y a ${deltaMinutes} min`;
        const deltaHours = Math.floor(deltaMinutes / 60);
        return `Synchronisé il y a ${deltaHours}h`;
    };

    return (
        <header className={`app-drag-region flex items-center justify-center pb-3 md:pb-5 pt-4 md:pt-8 lg:pt-10 min-h-[64px] md:min-h-[88px] shrink-0 w-full ${isProfileMenuOpen ? 'z-[1500]' : 'z-50'} ${isHomeSection ? 'absolute top-0 left-0' : 'relative'}`}>
            <div className="w-full px-4 md:px-8 sm:px-12 flex items-center justify-between max-w-[1400px] mx-auto mt-2" >
            <div className={`flex items-center overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isHomeSection ? 'max-w-[200px] opacity-100 mr-6' : (sidebarOpen ? 'max-w-0 opacity-0 ml-0 mr-0' : 'max-w-[180px] opacity-100 ml-0 md:-ml-4 mr-2 md:mr-4')
            }`}>
                <button
                    className="app-no-drag p-0 bg-transparent border-none cursor-pointer shrink-0"
                    onClick={() => {
                        navigate('/');
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            navigate('/');
                        }
                    }}
                    aria-label="Aller au tableau de bord"
                >
                    <img 
                        src="/Logo-vertical.svg" 
                        alt="Extnd" 
                        className={`transition-all duration-300 hover:opacity-80 ${isHomeSection ? 'h-[45px] md:h-[80px] ml-2 mt-2 md:ml-6 md:mt-6' : 'h-[38px] sm:h-[45px] md:h-[50px] ml-2 sm:ml-4'}`}
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
                        <MagnifyingGlass size={22} className="absolute left-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" weight="bold" />
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-[#18181b]/50 border border-slate-200/80 dark:border-white/10 rounded-2xl text-[16px] text-slate-900 dark:text-slate-100 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-white/20 pointer-events-none py-[12px] pr-[80px] pl-[48px]"
                            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]} 
                            readOnly
                        />
                        <span className="absolute right-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm">
                            <Command size={14} weight="bold" /> K
                        </span>
                    </div>
                </div>
            )}

            <div className="app-no-drag flex items-center gap-3 sm:gap-5 ml-auto">
                
                {user && (
                    <button 
                        className={`flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-0 ${isHomeSection ? 'mt-4 md:mt-6' : ''}`}
                        title={syncStatus === 'error' ? 'Réessayer la synchronisation' : getSyncLabel()}
                        aria-label={getSyncLabel()}
                        onClick={() => {
                            if (syncStatus === 'error' || pendingSyncTasks > 0) {
                                syncQueue.requestProcessQueue();
                            }
                        }}
                    >
                        {syncStatus === 'synced' && <CloudCheck size={18} weight="bold" className="text-emerald-500" />}
                        {syncStatus === 'pending' && <CloudArrowUp size={18} weight="bold" className="animate-pulse text-blue-500" />}
                        {syncStatus === 'error' && <WarningCircle size={18} weight="bold" className="text-red-500" />}
                        {syncStatus === 'error' && <ArrowsClockwise size={14} className="text-red-500" />}
                        <span className="hidden md:inline text-xs font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
                            {getSyncLabel()}
                        </span>
                    </button>
                )}

                <div className={`${isHomeSection ? 'mt-4 md:mt-6 ml-1 md:ml-3' : 'ml-1 md:ml-2'}`}>
                    <PomodoroTimer />
                </div>

                <div 
                    className={`relative transition-all duration-300 ${!isHomeSection ? '-mr-2 sm:-mr-8 md:-mr-24' : ''} ${isHomeSection ? 'mr-4 mt-4 md:mr-6 md:mt-6' : 'ml-1 md:ml-2'}`}
                >
                    <button 
                        className={`p-0 bg-transparent cursor-pointer rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${isProfileMenuOpen ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-[#09090b] scale-95' : 'ring-2 ring-transparent scale-100 hover:ring-slate-200 dark:hover:ring-white/20'}`}
                        onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                        aria-label="Mon compte"
                        title="Mon compte"
                    >
                        <Avatar
                            config={avatarConfig}
                            userName={userName}
                            photoURL={user?.photoURL}
                            style={{ fontSize: '18px' }}
                            className="w-[36px] h-[36px] md:!w-[48px] md:!h-[48px] md:!text-[20px]"
                        />
                    </button>
                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1050] animate-in fade-in duration-300 bg-slate-900/40 backdrop-blur-lg transition-all" 
                                aria-hidden="true"
                                onClick={() => setProfileMenuOpen(false)}></div>
                            <div 
                                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-[calc(100%+12px)] sm:left-auto sm:right-0 sm:translate-x-0 sm:translate-y-0 z-[1100] animate-in fade-in zoom-in-95 duration-200 ease-out w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] rounded-[24px] overflow-hidden flex flex-col bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] origin-center sm:origin-top-right"
                            >
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-4" >
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-sm" >
                                            <Avatar
                                                config={avatarConfig}
                                                userName={userName}
                                                photoURL={user?.photoURL}
                                                style={{ width: '100%', height: '100%', fontSize: '24px' }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 pl-1" >
                                            <span className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis block text-slate-900 dark:text-slate-50">
                                                {user?.displayName || userName}
                                            </span>
                                            <p className="text-sm mt-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium text-slate-500 dark:text-slate-400">
                                                {user?.email || 'Mode local (non connecté)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col gap-1" >
                                    <button 
                                        className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-[15px] font-medium transition-colors text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        onClick={() => { onNavigateSettings(); setProfileMenuOpen(false); }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            <GearSix size={20} weight="duotone" />
                                        </div>
                                        Paramètres du compte
                                    </button>

                                    <button 
                                        className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-[15px] font-medium transition-colors text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        onClick={() => { setThemeMode(darkMode ? 'light' : 'dark'); setProfileMenuOpen(false); }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            {darkMode ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />} 
                                        </div>
                                        {darkMode ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'}
                                    </button>

                                    <button 
                                        className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-[15px] font-medium transition-colors text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        onClick={() => { setThemeMode('system'); setProfileMenuOpen(false); }}
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            <Monitor size={20} weight="duotone" />
                                        </div>
                                        Thème Système
                                    </button>

                                    <button 
                                        className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-[15px] font-medium transition-colors text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            <DownloadSimple size={20} weight="duotone" />
                                        </div>
                                        Sauvegarder mes données
                                    </button>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
                                    {!user ? (
                                        <button 
                                            className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-emerald-500 font-bold text-[15px] transition-colors text-left w-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                            
                                            onClick={async () => {
                                                await signInWithGoogle();
                                                setProfileMenuOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500" >
                                                <Command size={20} weight="duotone" />
                                            </div>
                                            Se connecter avec Google
                                        </button>
                                    ) : (
                                        <button 
                                            className="profile-menu-item flex items-center gap-4 px-4 py-3 rounded-2xl border-none bg-transparent cursor-pointer text-red-400 font-bold text-[15px] transition-colors text-left w-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                            
                                            onClick={async () => {
                                                await logout();
                                                setProfileMenuOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400" >
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
