import React from 'react';
import type { SettingsTab } from '../SettingsPage';
import { useUIStore as useUI } from '../../store/useUIStore';
import { Avatar } from '../Avatar';
import { 
    Book, Brain, Palette, Database, Calendar, ChartBar, User, CreditCard, Robot
} from '@phosphor-icons/react';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    activeColorClass?: string;
    activeBgClass?: string;
}> = ({ label, icon, isActive, onClick, activeColorClass = 'text-teal-600 dark:text-teal-400', activeBgClass = 'bg-teal-50 dark:bg-teal-500/10' }) => (
    <button
        onClick={onClick}
        className={`w-auto md:w-full flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 border border-transparent ${
            isActive 
                ? `${activeBgClass} ${activeColorClass} font-bold shadow-sm` 
                : 'text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
    >
        <span className={`flex items-center justify-center ${isActive ? '' : 'opacity-70'}`}>
            {icon}
        </span>
        <span>{label}</span>
    </button>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2 mt-4 mb-1">
        {label}
    </div>
);

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    const { userName, avatarConfig } = useUI();

    return (
        <aside className="w-full md:w-[240px] shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col md:h-full z-20">
            {/* Header */}
            <div className="h-14 hidden md:flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <img src="/Logo-linear.svg" alt="Extnd" className="w-6 h-6 object-contain hidden dark:block" />
                <img src="/Logo-linear.svg" alt="Extnd" className="w-6 h-6 object-contain block dark:hidden brightness-0" />
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                    Paramètres
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto px-4 py-2 custom-scrollbar flex flex-row md:flex-col items-center md:items-stretch gap-1 md:gap-0">
                <SectionLabel label="Contenu" />
                <NavItem 
                    label="Abréviations" 
                    isActive={activeTab === 'dictionary'} 
                    onClick={() => setActiveTab('dictionary')} 
                    icon={<Book size={18} weight={activeTab === 'dictionary' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-indigo-600 dark:text-indigo-400"
                    activeBgClass="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20"
                />
                <NavItem 
                    label="Intelligence IA" 
                    isActive={activeTab === 'intelligence'} 
                    onClick={() => setActiveTab('intelligence')} 
                    icon={<Brain size={18} weight={activeTab === 'intelligence' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-purple-600 dark:text-purple-400"
                    activeBgClass="bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
                />
                <NavItem 
                    label="Modèles IA" 
                    isActive={activeTab === 'llm'} 
                    onClick={() => setActiveTab('llm')} 
                    icon={<Robot size={18} weight={activeTab === 'llm' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-emerald-600 dark:text-emerald-400"
                    activeBgClass="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                />

                <SectionLabel label="Application" />
                <NavItem 
                    label="Apparence" 
                    isActive={activeTab === 'appearance'} 
                    onClick={() => setActiveTab('appearance')} 
                    icon={<Palette size={18} weight={activeTab === 'appearance' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-sky-600 dark:text-sky-400"
                    activeBgClass="bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20"
                />
                <NavItem 
                    label="Révision" 
                    isActive={activeTab === 'advanced'} 
                    onClick={() => setActiveTab('advanced')} 
                    icon={<Calendar size={18} weight={activeTab === 'advanced' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-amber-600 dark:text-amber-400"
                    activeBgClass="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                />
                <NavItem 
                    label="Données" 
                    isActive={activeTab === 'data'} 
                    onClick={() => setActiveTab('data')} 
                    icon={<Database size={18} weight={activeTab === 'data' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-teal-600 dark:text-teal-400"
                    activeBgClass="bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20"
                />
                <NavItem 
                    label="Statistiques" 
                    isActive={activeTab === 'stats'} 
                    onClick={() => setActiveTab('stats')} 
                    icon={<ChartBar size={18} weight={activeTab === 'stats' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-cyan-600 dark:text-cyan-400"
                    activeBgClass="bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20"
                />

                <SectionLabel label="Compte" />
                <NavItem 
                    label="Profil" 
                    isActive={activeTab === 'profile'} 
                    onClick={() => setActiveTab('profile')} 
                    icon={<User size={18} weight={activeTab === 'profile' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-rose-600 dark:text-rose-400"
                    activeBgClass="bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                />
                <NavItem 
                    label="Abonnement" 
                    isActive={activeTab === 'subscription'} 
                    onClick={() => setActiveTab('subscription')} 
                    icon={<CreditCard size={18} weight={activeTab === 'subscription' ? 'fill' : 'bold'} />} 
                    activeColorClass="text-amber-600 dark:text-amber-400"
                    activeBgClass="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                />
            </nav>

            {/* User footer */}
            <div className="hidden md:block p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 overflow-hidden border border-slate-200/50 dark:border-white/10">
                        <Avatar
                            config={avatarConfig}
                            userName={userName}
                            style={{ width: '100%', height: '100%', borderRadius: 0, fontSize: '18px' }}
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {userName}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Connecté
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
