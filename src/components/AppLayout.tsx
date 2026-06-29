import type { ReactNode } from 'react';
import { useUIStore } from '../store/useUIStore';
import { GlobalHeader } from './GlobalHeader';
import { Stack, BookOpen, ShareNetwork, ClockCounterClockwise, ChartBar, List, Graph, X } from '@phosphor-icons/react';

type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats';

interface AppLayoutProps {
  children: ReactNode;
  onNavigate: (section: AppSection) => void;
  onNavigateSettings: () => void;
  pendingClusterReview?: boolean;
  onCancelClusterReview?: () => void;
}

export function AppLayout({ children, onNavigate, onNavigateSettings, pendingClusterReview, onCancelClusterReview }: AppLayoutProps) {
  const { activeSection, sidebarOpen, setSidebarOpen } = useUIStore();
  const isHomeSection = activeSection === 'dashboard';

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
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
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

      <main className="workspace-main">
        <GlobalHeader 
          isHomeSection={isHomeSection} 
          onNavigateSettings={onNavigateSettings} 
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
