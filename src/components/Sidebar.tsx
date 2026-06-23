import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stack, BookOpen, ShareNetwork, ClockCounterClockwise, ChartBar,
  ArrowLeft, List, Pause, Play, Trash, Tag, PencilSimple,
} from '@phosphor-icons/react';
import { useUI } from '../context/UIContext';
import type { PausedTask } from '../types';
import { TagManagerModal } from './TagManagerModal';

export interface SidebarProps {
  pausedTasks: PausedTask[];
  onResumeTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

const formatTaskTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} j`;
};

export const Sidebar: React.FC<SidebarProps> = ({ pausedTasks, onResumeTask, onRemoveTask }) => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUI();
  
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If sidebar is neither open (mobile) nor uncollapsed (desktop), do nothing
      if (!sidebarOpen && sidebarCollapsed) return;

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (sidebarOpen) setSidebarOpen(false);
        if (!sidebarCollapsed) setSidebarCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed]);

  
  const navItems = [
    { id: 'cards', path: '/browse', label: 'Base de connaissances', icon: <Stack size={20} weight="fill" /> },
    { id: 'courses', path: '/courses', label: 'Fiches de cours', icon: <BookOpen size={20} weight="fill" /> },
    { id: 'network', path: '/network', label: 'Graphe mental', icon: <ShareNetwork size={20} weight="bold" /> },
    { id: 'review', path: '/review', label: 'Sessions de révision', icon: <ClockCounterClockwise size={20} weight="bold" /> },
    { id: 'stats', path: '/stats', label: 'Statistiques', icon: <ChartBar size={20} weight="bold" /> }
  ];

  const shouldCollapseSidebar = sidebarCollapsed && !sidebarOpen;
  const isHomeSection = location.pathname === '/';
  const shouldShowSidebar = !isHomeSection || sidebarOpen;

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  if (!shouldShowSidebar) return null;

  return (
    <div className="workspace-sidebar-container" ref={sidebarRef}>
      {sidebarOpen && (
        <div 
          className="sidebar-overlay animate-in fade-in duration-200"
          style={{ position: 'fixed', inset: 0, zIndex: 90, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''} ${isHomeSection ? 'home-overlay' : ''}`} style={{ zIndex: 100 }}>
        <div className="workspace-sidebar-header" style={!shouldCollapseSidebar ? { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : {}}>
          {!shouldCollapseSidebar ? (
            <>
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <h2 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</h2>
              </div>
              <div className="workspace-sidebar-actions" style={{ marginLeft: 'auto' }}>
                <button className="workspace-btn" onClick={() => setSidebarCollapsed(true)} title="Réduire le menu">
                  <ArrowLeft size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="workspace-sidebar-actions" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className="workspace-btn" onClick={() => setSidebarCollapsed(false)} title="Agrandir le menu">
                <List size={20} weight="bold" />
              </button>
            </div>
          )}
        </div>

        <nav className="workspace-nav flex flex-col gap-1.5 p-3">
          {navItems.filter(i => i.id !== 'stats').map(item => (
            <button
              key={item.id}
              id={`tour-nav-${item.id}`}
              className={`workspace-nav-item ${location.pathname === item.path ? 'active' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''}`}
              onClick={() => navigateTo(item.path)}
              title={shouldCollapseSidebar ? item.label : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {!shouldCollapseSidebar && (
            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={() => setIsTagManagerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600,
                  width: '100%', textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <Tag size={16} /> Gérer les étiquettes
              </button>
            </div>
          )}

          {!shouldCollapseSidebar && pausedTasks.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div className="section-title" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px', paddingLeft: '20px' }}>
                Tâches en cours
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
                {pausedTasks.map(task => {
                  let TaskIcon = Pause;
                  if (task.type === 'card_edit') TaskIcon = PencilSimple;
                  else if (task.type === 'course_edit') TaskIcon = BookOpen;
                  else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;

                  return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: '28px', height: '28px', borderRadius: '6px', 
                        backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                      }}>
                        <TaskIcon size={14} color="var(--color-primary)" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={task.title}>
                          {task.title}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          {formatTaskTime(task.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => onResumeTask(task.id)} style={{ background: 'var(--color-primary)', border: 'none', cursor: 'pointer', padding: '6px', color: 'white', borderRadius: '6px' }} title="Reprendre">
                        <Play size={14} weight="bold" />
                      </button>
                      <button onClick={() => onRemoveTask(task.id)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '6px', color: 'var(--color-text-muted)', borderRadius: '6px' }} title="Abandonner">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
        
        <div className="workspace-nav-bottom flex flex-col gap-1.5 p-3" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', width: '100%', alignItems: shouldCollapseSidebar ? 'center' : 'stretch' }}>
          {navItems.filter(i => i.id === 'stats').map(item => (
            <button
              key={item.id}
              className={`workspace-nav-item ${location.pathname === item.path ? 'active' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''}`}
              onClick={() => navigateTo(item.path)}
              title={shouldCollapseSidebar ? item.label : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>
      {isTagManagerOpen && <TagManagerModal onClose={() => setIsTagManagerOpen(false)} />}
    </div>
  );
};
