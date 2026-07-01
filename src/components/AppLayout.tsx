import type { ReactNode } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useCardStore } from '../store/useCardStore';
import { GlobalHeader } from './GlobalHeader';
import { Stack, BookOpen, ShareNetwork, ClockCounterClockwise, ChartBar, List, Graph, X, Pause, PencilSimple } from '@phosphor-icons/react';
import { useTaskStore } from '../store/useTaskStore';
import { LicenseBanner } from './LicenseBanner';
import { useLicense } from '../lib/useLicense';
import { useMemo } from 'react';

type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats';

interface AppLayoutProps {
  children: ReactNode;
  onNavigate: (section: AppSection) => void;
  onNavigateSettings: () => void;
  pendingClusterReview?: boolean;
  onCancelClusterReview?: () => void;
  onResumeTask?: (id: string) => void;
}

export function AppLayout({ children, onNavigate, onNavigateSettings, pendingClusterReview, onCancelClusterReview, onResumeTask }: AppLayoutProps) {
  const { activeSection, sidebarOpen, setSidebarOpen } = useUIStore();
  const { pausedTasks, handleRemoveTask } = useTaskStore();
  const { licenseInfo } = useLicense();
  const { cards } = useCardStore();
  const isHomeSection = activeSection === 'dashboard';

  // U-8: Count due cards for the review badge
  const dueCount = useMemo(() => cards.filter(c => {
    if (!c.progress?.dueDate) return false;
    return new Date(c.progress.dueDate).getTime() <= Date.now() &&
      (c.progress.status === 'review' || c.progress.status === 'learning');
  }).length, [cards]);

  const navItems = [
    { id: 'cards', label: 'Base de connaissances', icon: <Stack size={20} weight="fill" /> },
    { id: 'courses', label: 'Fiches de cours', icon: <BookOpen size={20} weight="fill" /> },
    { id: 'network', label: 'Graphe mental', icon: <ShareNetwork size={20} weight="bold" /> },
    { id: 'review', label: 'Sessions de révision', icon: <ClockCounterClockwise size={20} weight="bold" /> },
    { id: 'stats', label: 'Statistiques', icon: <ChartBar size={20} weight="bold" /> }
  ] as const;

  return (
    <div className={`workspace-shell ${isHomeSection ? 'home-layout' : ''} ${sidebarOpen ? 'home-sidebar-open' : ''}`}>
      <div className="workspace-sidebar-container">
        <button className={`workspace-sidebar-backdrop ${sidebarOpen ? 'desktop-visible' : ''}`} aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />
        <aside className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} home-overlay`}>
          <div className={`workspace-sidebar-header ${sidebarOpen ? 'open' : 'collapsed'}`}>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', color: 'var(--color-primary)' }}>
                <img src="/Logo-linear.svg" alt="Extnd" className="brand-logo-img" style={{ height: '48px' }} />
              </div>
            )}
            <div className="workspace-sidebar-actions">
              <button className="workspace-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Menu">
                <List size={20} weight="bold" />
              </button>
            </div>
          </div>

          <nav className="workspace-nav">
            {navItems.filter(i => i.id !== 'stats').map(item => (
              <button
                key={item.id}
                className={`workspace-nav-item ${activeSection === item.id ? 'active' : ''} ${sidebarOpen ? '' : 'collapsed'}`}
                onClick={() => {
                  onNavigate(item.id as AppSection);
                  if (window.innerWidth <= 980) setSidebarOpen(false);
                }}
                style={{ position: 'relative' }}
              >
                {item.icon}
                <span>{item.label}</span>
                {/* U-8: due badge on review item */}
                {item.id === 'review' && dueCount > 0 && (
                  <span style={{
                    position: sidebarOpen ? 'static' : 'absolute',
                    top: sidebarOpen ? undefined : 4,
                    right: sidebarOpen ? undefined : 4,
                    minWidth: 18, height: 18,
                    borderRadius: 9,
                    background: '#8b5cf6',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    marginLeft: sidebarOpen ? 'auto' : undefined,
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(139,92,246,0.4)',
                  }}>
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {sidebarOpen && pausedTasks.length > 0 && (
            <div className="mt-8 px-4">
              <div className="text-[0.7rem] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-2">
                Tâches en cours
              </div>
              <div className="flex flex-col gap-2">
                {pausedTasks.map(task => {
                  let TaskIcon = Pause;
                  if (task.type === 'card_edit') TaskIcon = PencilSimple;
                  else if (task.type === 'course_edit') TaskIcon = BookOpen;
                  else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;

                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer" onClick={() => onResumeTask && onResumeTask(task.id)}>
                        <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
                          <TaskIcon size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis font-medium" title={task.title}>
                          {task.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveTask(task.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors shrink-0" 
                        title="Supprimer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="workspace-nav-bottom" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginBottom: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.filter(i => i.id === 'stats').map(item => (
              <button
                key={item.id}
                className={`workspace-nav-item ${activeSection === item.id ? 'active' : ''} ${sidebarOpen ? '' : 'collapsed'}`}
                onClick={() => {
                  onNavigate(item.id as AppSection);
                  if (window.innerWidth <= 980) setSidebarOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          

        </aside>
      </div>

      <main className="workspace-main" style={{ display: 'flex', flexDirection: 'column' }}>
        <GlobalHeader 
          isHomeSection={isHomeSection} 
          onNavigateSettings={onNavigateSettings} 
        />
        <LicenseBanner 
          licenseInfo={licenseInfo} 
          onUpgrade={() => onNavigateSettings()} 
        />

        <div className="workspace-content-scroll" style={isHomeSection ? { padding: 0 } : {}}>
          {pendingClusterReview && activeSection === 'network' && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-3">
                <Graph size={20} weight="bold" />
                Veuillez sélectionner un noeud central pour réviser son cluster
                <button onClick={onCancelClusterReview} className="ml-2 hover:bg-indigo-700 p-1 rounded-full transition-colors">
                  <X size={14} weight="bold" />
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
