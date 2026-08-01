import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stack, BookOpen, ShareNetwork, ClockCounterClockwise, ChartBar,
  List, ArrowLeft, Pause, Play, Trash, Tag, PencilSimple,
} from '@phosphor-icons/react';
import { useUIStore as useUI } from '../store/useUIStore';
import type { PausedTask } from '../types';
import { TagManagerModal } from './TagManagerModal';
import { useTranslation } from 'react-i18next';
import { useCardStore } from '../store/useCardStore';
import { useMemo } from 'react';
import './styles/Sidebar.css';

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

// Nav item definition
interface NavDef {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  accent?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ pausedTasks, onResumeTask, onRemoveTask }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUI();
  const { cards } = useCardStore();

  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Count due cards for the review badge
  const dueCount = useMemo(() => cards.filter(c => {
    if (!c.progress?.dueDate) return false;
    return new Date(c.progress.dueDate).getTime() <= Date.now() &&
      (c.progress.status === 'review' || c.progress.status === 'learning');
  }).length, [cards]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!sidebarOpen && sidebarCollapsed) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (sidebarOpen) setSidebarOpen(false);
        if (!sidebarCollapsed) setSidebarCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed]);

  const navItems: NavDef[] = [
    { id: 'cards', path: '/cards', label: t('sidebar.knowledge_base'), icon: <Stack size={20} weight="fill" />, accent: '#0d9488' },
    { id: 'courses', path: '/courses', label: t('sidebar.courses'), icon: <BookOpen size={20} weight="fill" />, accent: '#6366f1' },
    { id: 'network', path: '/network', label: t('sidebar.network'), icon: <ShareNetwork size={20} weight="bold" />, accent: '#8b5cf6' },
    { id: 'review', path: '/review', label: t('sidebar.review'), icon: <ClockCounterClockwise size={20} weight="bold" />, accent: '#f59e0b' },
    { id: 'stats', path: '/stats', label: t('sidebar.stats'), icon: <ChartBar size={20} weight="bold" />, accent: '#06b6d4' },
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
          className="sidebar-overlay sidebar-style-1"
          
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''} ${isHomeSection ? 'home-overlay' : ''} sidebar-style-2`}
        
      >
        {/* Header */}
        <div
          className="sidebar-style-3" style={{
  justifyContent: shouldCollapseSidebar ? 'center' : 'space-between',
  padding: shouldCollapseSidebar ? '16px 0 12px' : '16px 12px 12px'
}}
        >
          {!shouldCollapseSidebar && (
            <img src="/Logo-linear.svg" alt="Extnd" className="sidebar-style-4"  />
          )}
          <button
            className="workspace-btn sidebar-style-5"
            
            onClick={() => {
              if (shouldCollapseSidebar) {
                setSidebarCollapsed(false);
              } else {
                setSidebarCollapsed(true);
                setSidebarOpen(false);
              }
            }}
            title={shouldCollapseSidebar ? 'Ouvrir le menu' : 'Réduire le menu'}
          >
            {shouldCollapseSidebar ? <List size={18} weight="bold" /> : <ArrowLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="workspace-nav">
          {navItems.filter(i => i.id !== 'stats').map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                id={`tour-nav-${item.id}`}
                className={`workspace-nav-item ${isActive ? 'active' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''}`}
                onClick={() => navigateTo(item.path)}
                title={shouldCollapseSidebar ? item.label : undefined}
                style={isActive ? {
                  background: `${item.accent}18`,
                  color: item.accent,
                } : {}}
              >
                <span className="sidebar-style-6" style={{
  color: isActive ? item.accent : undefined
}}>
                  {item.icon}
                </span>
                {!shouldCollapseSidebar && (
                  <span className="sidebar-style-7" >{item.label}</span>
                )}
                {/* Due badge on review item */}
                {item.id === 'review' && dueCount > 0 && (
                  <span className="sidebar-style-8" style={{
  marginLeft: shouldCollapseSidebar ? undefined : 'auto',
  position: shouldCollapseSidebar ? 'absolute' : 'static',
  top: shouldCollapseSidebar ? 4 : undefined,
  right: shouldCollapseSidebar ? 4 : undefined
}}>
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tags button — visible only when expanded */}
          {!shouldCollapseSidebar && (
            <div className="sidebar-style-9" >
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="sidebar-style-10" 
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <Tag size={18} /> {t('sidebar.tags')}
              </button>
            </div>
          )}

          {/* Paused tasks */}
          {!shouldCollapseSidebar && pausedTasks.length > 0 && (
            <div className="sidebar-style-11" >
              <div className="sidebar-style-12" >
                {t('sidebar.active_tasks')}
              </div>
              <div className="sidebar-style-13" >
                {pausedTasks.map(task => {
                  let TaskIcon = Pause;
                  if (task.type === 'card_edit') TaskIcon = PencilSimple;
                  else if (task.type === 'course_edit') TaskIcon = BookOpen;
                  else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;
                  return (
                    <div key={task.id} className="sidebar-style-14" >
                      <div className="sidebar-style-15" >
                        <div className="sidebar-style-16" >
                          <TaskIcon size={13} color="var(--color-primary)" />
                        </div>
                        <div className="sidebar-style-17" >
                          <span className="sidebar-style-18"  title={task.title}>
                            {task.title}
                          </span>
                          <span className="sidebar-style-19" >
                            {formatTaskTime(task.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="sidebar-style-20" >
                        <button onClick={() => onResumeTask(task.id)} className="sidebar-style-21"  title="Reprendre">
                          <Play size={12} weight="bold" />
                        </button>
                        <button onClick={() => onRemoveTask(task.id)} className="sidebar-style-22"  title="Abandonner">
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Stats at bottom */}
        <div className="sidebar-style-23" >
          {navItems.filter(i => i.id === 'stats').map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                className={`workspace-nav-item ${isActive ? 'active' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''}`}
                onClick={() => navigateTo(item.path)}
                title={shouldCollapseSidebar ? item.label : undefined}
                style={isActive ? { background: `${item.accent}18`, color: item.accent } : {}}
              >
                <span className="sidebar-style-24" style={{
  color: isActive ? item.accent : undefined
}}>
                  {item.icon}
                </span>
                {!shouldCollapseSidebar && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </aside>
      {isTagManagerOpen && <TagManagerModal onClose={() => setIsTagManagerOpen(false)} />}
    </div>
  );
};
