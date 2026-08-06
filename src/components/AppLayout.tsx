import type { ReactNode } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useCardStore } from '../store/useCardStore';
import { useCurrentSection } from '../hooks/useCurrentSection';
import { GlobalHeader } from './GlobalHeader';
import { Stack, BookOpen, ShareNetwork, ClockCounterClockwise, ChartBar, List, Graph, X, Pause, PencilSimple } from '@phosphor-icons/react';
import { useTaskStore } from '../store/useTaskStore';
import { LicenseBanner } from './LicenseBanner';
import { useLicense } from '../lib/useLicense';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppSection } from '../types';

interface AppLayoutProps {
  children: ReactNode;
  onNavigate: (section: AppSection) => void;
  onNavigateSettings: () => void;
  pendingClusterReview?: boolean;
  onCancelClusterReview?: () => void;
  onResumeTask?: (id: string) => void;
}

  export function AppLayout({ children, onNavigate, onNavigateSettings, pendingClusterReview, onCancelClusterReview, onResumeTask }: AppLayoutProps) {
    const { sidebarOpen, setSidebarOpen, isProfileMenuOpen } = useUIStore();
    const activeSection = useCurrentSection();
    const { pausedTasks, handleRemoveTask } = useTaskStore();
    const { licenseInfo } = useLicense();
    const { cards } = useCardStore();
    const isHomeSection = activeSection === 'dashboard';
  
    // Count due cards for the review badge
    const dueCount = useMemo(() => cards.filter(c => {
      if (!c.progress?.dueDate) return false;
      return new Date(c.progress.dueDate).getTime() <= Date.now() &&
        (c.progress.status === 'review' || c.progress.status === 'learning');
    }).length, [cards]);
  
    const navItems = [
      { id: 'cards', label: 'Base de connaissances', icon: <Stack size={22} weight="duotone" /> },
      { id: 'courses', label: 'Fiches de cours', icon: <BookOpen size={22} weight="duotone" /> },
      { id: 'network', label: 'Graphe mental', icon: <ShareNetwork size={22} weight="duotone" /> },
      { id: 'review', label: 'Sessions de révision', icon: <ClockCounterClockwise size={22} weight="duotone" /> },
      { id: 'stats', label: 'Statistiques', icon: <ChartBar size={22} weight="duotone" /> }
    ] as const;
  
    return (
      <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#09090b] relative selection:bg-teal-500/20 selection:text-teal-900 dark:selection:text-teal-100">
        
        {/* Sidebar Container */}
        <div 
          className={`relative flex-shrink-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] z-[100] ${
              isHomeSection ? 'w-0' : 'w-[104px]'
          }`}
        >
          {/* Backdrop for mobile and desktop overlay */}
          <button 
              className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:bg-slate-900/10 lg:backdrop-blur-[2px] z-[990] transition-opacity duration-300 border-none cursor-pointer ${
                  sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Fermer le menu" 
              onClick={() => setSidebarOpen(false)} 
          />
          
          {/* Sidebar */}
          <aside 
              className={`absolute top-4 lg:top-8 left-4 bottom-4 bg-white/80 dark:bg-[#18181b]/70 backdrop-blur-2xl border border-white/50 dark:border-white/5 rounded-[24px] flex flex-col overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1300] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)] ${
                  isHomeSection ? 'hidden' : 'flex'
              } opacity-100 translate-x-0 ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
          >
            {/* Header */}
            <div className={`flex items-center px-4 py-5 transition-all duration-300 h20 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {sidebarOpen && (
                    <div className="flex items-center text-teal-600 dark:text-teal-400 pl-2">
                        <img src="/Logo-linear.svg" alt="Extnd" className="h-9 w-auto" />
                    </div>
                )}
                <button 
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    title="Menu"
                >
                    <List size={22} weight="bold" />
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-col gap-1.5 px-3 py-2 flex-1 w-full">
                {navItems.filter(i => i.id !== 'stats').map(item => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as AppSection);
                                setSidebarOpen(false);
                                useUIStore.getState().setProfileMenuOpen(false);
                            }}
                            className={`relative flex items-center w-full rounded-2xl transition-all duration-300 group border-none cursor-pointer outline-none ${
                                sidebarOpen ? 'px-4 py-3.5 justify-start gap-4 min-h-[48px]' : 'py-3.5 justify-center min-h-[48px]'
                            } ${
                                isActive 
                                    ? 'bg-white dark:bg-white/5 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 text-slate-900 dark:text-white font-bold' 
                                    : 'bg-transparent text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-slate-900 dark:bg-white rounded-r-full shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                            )}
                            
                            <div className={`flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110 text-slate-900 dark:text-white' : 'group-hover:scale-110 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            
                            {sidebarOpen && (
                                <span className="text-[14px] tracking-tight whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                            
                            {/* Due Badge */}
                            {item.id === 'review' && dueCount > 0 && (
                                <span 
                                    className={`flex items-center justify-center rounded-full bg-indigo-500 text-white font-extrabold shadow-sm ${
                                        sidebarOpen 
                                            ? 'ml-auto h-5 min-w-[20px] px-1.5 text-xs' 
                                            : 'absolute top-2 right-2 h-4 min-w-[16px] px-1 text-[9px]'
                                    }`}
                                >
                                    {dueCount > 99 ? '99+' : dueCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Paused Tasks */}
            {sidebarOpen && pausedTasks.length > 0 && (
                <div className="px-5 mb-4 mt-auto">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pl-1">
                        Tâches en cours
                    </div>
                    <div className="flex flex-col gap-2">
                        {pausedTasks.map(task => {
                            let TaskIcon = Pause;
                            if (task.type === 'card_edit') TaskIcon = PencilSimple;
                            else if (task.type === 'course_edit') TaskIcon = BookOpen;
                            else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;

                            return (
                                <div key={task.id} className="group flex items-center justify-between p-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 hover:border-slate-900/10 dark:hover:border-white/10 hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={() => onResumeTask && onResumeTask(task.id)}>
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center shrink-0 text-white dark:text-slate-900 shadow-sm">
                                            <TaskIcon size={16} weight="duotone" />
                                        </div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate" title={task.title}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveTask(task.id); }} 
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100" 
                                        title="Supprimer"
                                    >
                                        <X size={16} weight="bold" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
          
            {/* Bottom Navigation */}
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/60 p-3 flex flex-col gap-1 w-full">
                {navItems.filter(i => i.id === 'stats').map(item => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as AppSection);
                                setSidebarOpen(false);
                                useUIStore.getState().setProfileMenuOpen(false);
                            }}
                            className={`relative flex items-center w-full rounded-2xl transition-all duration-300 group border-none cursor-pointer outline-none ${
                                sidebarOpen ? 'px-4 py-3.5 justify-start gap-4 min-h-[48px]' : 'py-3.5 justify-center min-h-[48px]'
                            } ${
                                isActive 
                                    ? 'bg-white dark:bg-white/5 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 text-slate-900 dark:text-white font-bold' 
                                    : 'bg-transparent text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <div className={`flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110 text-slate-900 dark:text-white' : 'group-hover:scale-110 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            {sidebarOpen && (
                                <span className="text-[14px] tracking-tight whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-transparent relative overflow-hidden">
        <GlobalHeader 
          isHomeSection={isHomeSection} 
          onNavigateSettings={onNavigateSettings} 
        />
        <LicenseBanner 
          licenseInfo={licenseInfo} 
          onUpgrade={() => onNavigateSettings()} 
        />

        <div className="flex-1 overflow-hidden flex flex-col w-full relative" style={(isHomeSection || activeSection === 'add') ? { padding: 0 } : {}}>
          {pendingClusterReview && activeSection === 'network' && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl shadow-xl font-bold text-[15px] flex items-center gap-3">
                <Graph size={22} weight="duotone" />
                Veuillez sélectionner un noeud central pour réviser son cluster
                <button onClick={onCancelClusterReview} className="ml-3 hover:bg-indigo-700/80 p-1.5 rounded-xl transition-colors text-indigo-100 hover:text-white">
                  <X size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
