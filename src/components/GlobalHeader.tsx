import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        setUserName, 
        setAddDataMode,
        setActiveSection
    } = useUI();

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        if (isHomeSection) return;
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isHomeSection]);

    return (
        <header className={`app-drag-region flex items-center justify-center py-6 min-h-[88px] z-10 shrink-0 w-full ${isHomeSection ? 'absolute top-0 left-0 border-none' : 'relative border-b border-slate-200/50 dark:border-slate-800/50'}`}>
            {!isHomeSection && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pointer-events-none" style={{ zIndex: -1 }} />
            )}
            <div className="w-full max-w-[1600px] px-8 sm:px-12 flex items-center justify-between mx-auto">
            <div className="flex items-center gap-6">
                {!isHomeSection && (
                    <button 
                        className="app-no-drag flex items-center justify-center w-12 h-12 rounded-full bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer transition-colors shadow-sm" 
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir le menu"
                        title="Menu"
                    >
                        <List size={22} weight="bold" />
                    </button>
                )}
                <img 
                    src="/Logo-linear.svg" 
                    alt="Extnd" 
                    className="app-no-drag transition-all duration-300 cursor-pointer hover:opacity-80"
                    style={isHomeSection ? { height: '48px', marginLeft: '24px', marginTop: '24px' } : { height: '36px' }}
                    onClick={() => {
                        setActiveSection('dashboard');
                        navigate('/');
                    }}
                />
            </div>

            {!isHomeSection && (
                <div className="app-no-drag flex-1 max-w-2xl mx-12 hidden sm:flex justify-center cursor-text">
                    <div 
                        className="relative flex items-center w-full group"
                        onClick={() => setOmniboxOpen(true)}
                    >
                        <MagnifyingGlass size={22} className="absolute left-5 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" weight="bold" />
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-full text-[16px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-600 pointer-events-none"
                            style={{ padding: '14px 80px 14px 54px' }}
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
                
                <div 
                    className="relative transition-all duration-300"
                    style={isHomeSection ? { marginRight: '24px', marginTop: '24px' } : { marginLeft: '12px' }}
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
                            style={isHomeSection ? { width: '48px', height: '48px', fontSize: '20px' } : { width: '44px', height: '44px', fontSize: '18px' }}
                        >
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </button>
                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1050] animate-in fade-in duration-300 bg-slate-900/40 backdrop-blur-lg transition-all" 
                                onClick={() => setProfileMenuOpen(false)}></div>
                            <div className="absolute right-0 top-[calc(100%+12px)] z-[1100] animate-in fade-in slide-in-from-top-4 duration-200 w-[380px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-[32px] shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                <div className="p-8 pb-8 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
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
                                            className="w-full bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl text-slate-900 dark:text-slate-100 outline-none text-sm font-medium py-3 px-5 shadow-[0_0_0_4px_rgba(16,185,129,0.1)] transition-all"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-2xl shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 shrink-0 ring-4 ring-white dark:ring-slate-900">
                                                {userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 pl-2">
                                                <button 
                                                    className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer text-slate-900 dark:text-white font-bold text-[18px] transition-colors text-left group" 
                                                    onClick={() => { setIsEditingName(true); setTempName(userName); }} 
                                                    title="Modifier mon nom"
                                                    aria-label="Modifier mon nom"
                                                >
                                                    <span className="whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{userName}</span>
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <PencilSimple size={14} weight="bold" className="text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                </button>
                                                <p className="text-slate-500 dark:text-slate-400 text-[14px] m-0 mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">pierrick@extnd.app</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col gap-2.5">
                                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 dark:text-slate-200 text-[15px] font-medium border-none bg-transparent cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                                            onClick={() => { onNavigateSettings(); setProfileMenuOpen(false); }}>
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                            <GearSix size={22} weight="duotone" />
                                        </div>
                                        <span>Paramètres du compte</span>
                                    </button>

                                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 dark:text-slate-200 text-[15px] font-medium border-none bg-transparent cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                                            onClick={() => { setThemeMode(darkMode ? 'light' : 'dark'); setProfileMenuOpen(false); }}>
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                            {darkMode ? <Sun size={22} weight="duotone" /> : <Moon size={22} weight="duotone" />} 
                                        </div>
                                        <span>{darkMode ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'}</span>
                                    </button>

                                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 dark:text-slate-200 text-[15px] font-medium border-none bg-transparent cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                                            onClick={() => { setThemeMode('system'); setProfileMenuOpen(false); }}>
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                            <Monitor size={22} weight="duotone" />
                                        </div>
                                        <span>Thème Système</span>
                                    </button>

                                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 dark:text-slate-200 text-[15px] font-medium border-none bg-transparent cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
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
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                            <DownloadSimple size={22} weight="duotone" />
                                        </div>
                                        <span>Sauvegarder mes données</span>
                                    </button>
                                </div>

                                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-600 dark:text-rose-500 text-[15px] font-bold border-none bg-transparent cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm group"
                                            onClick={() => setProfileMenuOpen(false)}>
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm border border-rose-200/50 dark:border-rose-800/50">
                                            <SignOut size={22} weight="duotone" />
                                        </div>
                                        <span>Déconnexion</span>
                                    </button>
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
