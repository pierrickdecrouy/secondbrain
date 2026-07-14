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
          className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 90, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} ${shouldCollapseSidebar ? 'collapsed' : ''} ${isHomeSection ? 'home-overlay' : ''}`}
        style={{ zIndex: 100 }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: shouldCollapseSidebar ? 'center' : 'space-between',
            padding: shouldCollapseSidebar ? '16px 0 12px' : '16px 12px 12px',
            borderBottom: '1px solid var(--color-border)',
            minHeight: 56,
            flexShrink: 0,
          }}
        >
          {!shouldCollapseSidebar && (
            <img src="/Logo-linear.svg" alt="Extnd" style={{ height: 28, width: 'auto', marginLeft: 4 }} />
          )}
          <button
            className="workspace-btn"
            style={{ borderRadius: 10 }}
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
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? item.accent : undefined }}>
                  {item.icon}
                </span>
                {!shouldCollapseSidebar && (
                  <span style={{ flex: 1 }}>{item.label}</span>
                )}
                {/* Due badge on review item */}
                {item.id === 'review' && dueCount > 0 && (
                  <span style={{
                    minWidth: 18, height: 18,
                    borderRadius: 9,
                    background: '#f59e0b',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    marginLeft: shouldCollapseSidebar ? undefined : 'auto',
                    position: shouldCollapseSidebar ? 'absolute' : 'static',
                    top: shouldCollapseSidebar ? 4 : undefined,
                    right: shouldCollapseSidebar ? 4 : undefined,
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(245,158,11,0.4)',
                    flexShrink: 0,
                  }}>
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tags button — visible only when expanded */}
          {!shouldCollapseSidebar && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setIsTagManagerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: 'none', border: 'none', cursor: 'pointer', borderRadius: 12,
                  color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500,
                  width: '100%', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <Tag size={18} /> {t('sidebar.tags')}
              </button>
            </div>
          )}

          {/* Paused tasks */}
          {!shouldCollapseSidebar && pausedTasks.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 8, paddingLeft: 12 }}>
                {t('sidebar.active_tasks')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pausedTasks.map(task => {
                  let TaskIcon = Pause;
                  if (task.type === 'card_edit') TaskIcon = PencilSimple;
                  else if (task.type === 'course_edit') TaskIcon = BookOpen;
                  else if (task.type === 'review_session') TaskIcon = ClockCounterClockwise;
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', borderRadius: 10, backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', margin: '0 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <TaskIcon size={13} color="var(--color-primary)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={task.title}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>
                            {formatTaskTime(task.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 4 }}>
                        <button onClick={() => onResumeTask(task.id)} style={{ background: 'var(--color-primary)', border: 'none', cursor: 'pointer', padding: '5px', color: 'white', borderRadius: 6 }} title="Reprendre">
                          <Play size={12} weight="bold" />
                        </button>
                        <button onClick={() => onRemoveTask(task.id)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '5px', color: 'var(--color-text-muted)', borderRadius: 6 }} title="Abandonner">
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
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px', flexShrink: 0 }}>
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
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? item.accent : undefined }}>
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
