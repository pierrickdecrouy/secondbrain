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
          className="sidebar-overlay fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-[4px]"
          
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''} ${isHomeSection ? 'home-overlay' : ''} sidebar-style-2`}
        
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-slate-200 dark:border-slate-800 min-h-[56px] shrink-0" style={{
  justifyContent: shouldCollapseSidebar ? 'center' : 'space-between',
  padding: shouldCollapseSidebar ? '16px 0 12px' : '16px 12px 12px'
}}
        >
          {!shouldCollapseSidebar && (
            <img src="/Logo-linear.svg" alt="Extnd" className="h-7 w-auto ml-1"  />
          )}
          <button
            className="workspace-btn rounded-[10px]"
            
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
                <span className="shrink-0 flex items-center" style={{
  color: isActive ? item.accent : undefined
}}>
                  {item.icon}
                </span>
                {!shouldCollapseSidebar && (
                  <span className="flex-1" >{item.label}</span>
                )}
                {/* Due badge on review item */}
                {item.id === 'review' && dueCount > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[0.6rem] font-extrabold flex items-center justify-center px-1 leading-none shadow-[0_1px_4px_rgba(245,158,11,0.4)] shrink-0" style={{
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
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800" >
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="flex items-center gap-3 px-3 py-2.5 bg-transparent border-none cursor-pointer rounded-xl text-slate-500 text-sm font-medium w-full transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100" 
                
                
              >
                <Tag size={18} /> {t('sidebar.tags')}
              </button>
            </div>
          )}

          {/* Paused tasks */}
          {!shouldCollapseSidebar && pausedTasks.length > 0 && (
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3" >
              <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-slate-500 mb-2 pl-3" >
                {t('sidebar.active_tasks')}
              </div>
              <div className="flex flex-col gap-1.5" >
                {pausedTasks.map(task => {
                  let TaskIcon = Pause;
                  if (task.type === 'card_edit') TaskIcon = PencilSimple;
                  else if (task.type === 'course_edit') TaskIcon = BookOpen;
                  else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;
                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-1" >
                      <div className="flex items-center gap-2 overflow-hidden flex-1" >
                        <div className="w-[26px] h-[26px] rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shrink-0" >
                          <TaskIcon size={13} color="var(--color-primary)" />
                        </div>
                        <div className="flex flex-col overflow-hidden" >
                          <span className="text-[0.78rem] text-slate-900 dark:text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis font-medium"  title={task.title}>
                            {task.title}
                          </span>
                          <span className="text-[0.62rem] text-slate-500" >
                            {formatTaskTime(task.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-[3px] shrink-0 ml-1" >
                        <button onClick={() => onResumeTask(task.id)} className="bg-emerald-500 border-none cursor-pointer p-[5px] text-white rounded-md"  title="Reprendre">
                          <Play size={12} weight="bold" />
                        </button>
                        <button onClick={() => onRemoveTask(task.id)} className="bg-transparent border border-slate-200 dark:border-slate-800 cursor-pointer p-[5px] text-slate-500 rounded-md"  title="Abandonner">
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
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 shrink-0" >
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
                <span className="shrink-0 flex items-center" style={{
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
