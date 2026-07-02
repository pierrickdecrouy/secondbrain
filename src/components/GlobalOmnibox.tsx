import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MagnifyingGlass, X, ArrowRight, Moon, Sun, Plus,
    ChartBar, Brain, Lightning, Cards, BookOpen, Tag, Funnel,
    ArrowElbowDownLeft
} from '@phosphor-icons/react';
import { useUIStore as useUI } from '../store/useUIStore';
import { useCardStore as useCards } from '../store/useCardStore';
import { useTheme } from '../context/ThemeContext';
import { stripMarkdown } from '../utils';
import { DynamicIcon } from './DynamicIcon';
import { hybridSearch } from '../searchIndex';
import type { Card } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlashCommand {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    aliases: string[];
    action: () => void;
}

interface FilterCommand {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseQuery = (query: string) => {
    const trimmed = query.trim();
    const isSystem = trimmed.startsWith('>');
    const isSlash = trimmed.startsWith('/') && !isSystem;
    const slashCmd = isSlash ? trimmed.substring(1).toLowerCase() : '';
    const colonIdx = slashCmd.indexOf(':');
    const afterColon = colonIdx >= 0 ? slashCmd.substring(colonIdx + 1) : '';
    const isFilterMode = slashCmd.startsWith('tag:') || slashCmd.startsWith('type:');
    return { isSlash, isSystem, slashCmd, afterColon, isFilterMode };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const GlobalOmnibox: React.FC = () => {
    const { isOmniboxOpen, setOmniboxOpen, searchQuery, setSearchQuery, setActiveFilters } = useUI();
    const { cards } = useCards();
    const { getCategoryIcon, getCategoryColor, setThemeMode } = useTheme();
    const { setAddDataMode } = useUI();
    const navigate = useNavigate();

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [results, setResults] = useState<Card[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { isSlash, isSystem, slashCmd, afterColon, isFilterMode } = useMemo(
        () => parseQuery(localQuery),
        [localQuery]
    );

    // Unique tags and types
    const uniqueTags = useMemo(() => {
        const set = new Set<string>();
        cards.forEach(c => c.tags?.forEach(t => set.add(t)));
        return Array.from(set).sort();
    }, [cards]);

    const uniqueTypes = useMemo(() => {
        const set = new Set<string>();
        cards.forEach(c => { if (c.type) set.add(c.type); });
        return Array.from(set).sort();
    }, [cards]);

    // Due cards count
    const dueCount = useMemo(() => cards.filter(c => {
        if (!c.progress?.dueDate) return false;
        return new Date(c.progress.dueDate).getTime() <= Date.now() &&
            (c.progress.status === 'review' || c.progress.status === 'learning');
    }).length, [cards]);

    // Slash commands
    const buildSlashCommands = useCallback((): SlashCommand[] => [
        {
            id: 'new-concept', label: 'Nouvelle fiche', description: 'Créer une fiche concept',
            icon: <Plus size={18} weight="bold" />, color: '#6366f1',
            aliases: ['c', 'carte', 'fiche', 'concept', 'new'],
            action: () => { setAddDataMode('create'); setOmniboxOpen(false); navigate('/browse'); }
        },
        {
            id: 'new-course', label: 'Nouveau cours', description: 'Créer un cours structuré',
            icon: <BookOpen size={18} weight="bold" />, color: '#0ea5e9',
            aliases: ['co', 'cours', 'course'],
            action: () => { setAddDataMode('create'); setOmniboxOpen(false); navigate('/courses'); }
        },
        {
            id: 'new-flash-qa', label: 'Flashcard Q&A', description: 'Nouvelle flashcard question / réponse',
            icon: <Cards size={18} weight="bold" />, color: '#10b981',
            aliases: ['f', 'flash', 'flashcard', 'qa'],
            action: () => { setAddDataMode('create'); setOmniboxOpen(false); navigate('/browse'); }
        },
        {
            id: 'new-flash-cloze', label: 'Texte à trous', description: 'Créer un texte lacunaire (cloze)',
            icon: <Lightning size={18} weight="bold" />, color: '#f59e0b',
            aliases: ['cl', 'cloze', 'trou', 'lacunaire'],
            action: () => { setAddDataMode('create'); setOmniboxOpen(false); navigate('/browse'); }
        },
        {
            id: 'start-review', label: 'Révision FSRS', description: 'Lancer une session de révision',
            icon: <Brain size={18} weight="bold" />, color: '#8b5cf6',
            aliases: ['r', 'rev', 'revision', 'reviser', 'révision'],
            action: () => { setOmniboxOpen(false); navigate('/review'); }
        },
        {
            id: 'view-stats', label: 'Statistiques', description: 'Consulter mes progrès',
            icon: <ChartBar size={18} weight="bold" />, color: '#ec4899',
            aliases: ['s', 'stat', 'stats', 'statistiques'],
            action: () => { setOmniboxOpen(false); navigate('/stats'); }
        },
    ], [setAddDataMode, setOmniboxOpen, navigate]);

    const slashCommands = useMemo(() => {
        const all = buildSlashCommands();
        if (!slashCmd) return all;
        return all.filter(cmd =>
            cmd.aliases.some(a => a.startsWith(slashCmd)) ||
            cmd.label.toLowerCase().includes(slashCmd)
        );
    }, [slashCmd, buildSlashCommands]);

    // Filter commands
    const filterCommands = useMemo((): FilterCommand[] => {
        if (slashCmd.startsWith('tag:')) {
            const q = afterColon.toLowerCase();
            return uniqueTags
                .filter(t => !q || t.toLowerCase().includes(q))
                .slice(0, 9)
                .map(tag => ({
                    id: `tag:${tag}`, label: `#${tag}`, icon: <Tag size={15} />,
                    action: () => { setSearchQuery(''); setActiveFilters([tag]); setOmniboxOpen(false); navigate('/browse'); }
                }));
        }
        if (slashCmd.startsWith('type:')) {
            const q = afterColon.toLowerCase();
            return uniqueTypes
                .filter(t => !q || t.toLowerCase().includes(q))
                .slice(0, 9)
                .map(type => ({
                    id: `type:${type}`, label: type, icon: <Funnel size={15} />,
                    action: () => { setSearchQuery(''); setActiveFilters([type]); setOmniboxOpen(false); navigate('/browse'); }
                }));
        }
        return [];
    }, [slashCmd, afterColon, uniqueTags, uniqueTypes, setSearchQuery, setActiveFilters, setOmniboxOpen, navigate]);

    // System commands
    const systemCommands = useMemo(() => [
        { id: 'theme-dark', label: 'Thème Sombre', icon: <Moon size={16} />, keywords: ['sombre', 'dark'], action: () => setThemeMode('dark') },
        { id: 'theme-light', label: 'Thème Clair', icon: <Sun size={16} />, keywords: ['clair', 'light'], action: () => setThemeMode('light') },
    ], [setThemeMode]);

    const filteredSystemCommands = useMemo(() => {
        const q = localQuery.trim().substring(1).trim().toLowerCase();
        if (!q) return systemCommands;
        return systemCommands.filter(c => c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q)));
    }, [localQuery, systemCommands]);

    // Active list for keyboard nav
    const activeList = useMemo(() => {
        if (isFilterMode) return filterCommands;
        if (isSlash) return slashCommands;
        if (isSystem) return filteredSystemCommands;
        return results;
    }, [isFilterMode, isSlash, isSystem, filterCommands, slashCommands, filteredSystemCommands, results]);

    const totalItems = activeList.length + (!isSlash && !isSystem && results.length > 0 ? 1 : 0);

    // Sync on open
    useEffect(() => {
        if (isOmniboxOpen) {
            setLocalQuery(searchQuery);
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOmniboxOpen]);

    // Memoize card map for faster O(1) lookups instead of O(N*M)
    const allCardsMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    // Live search
    useEffect(() => {
        if (!localQuery.trim() || isSlash || isSystem) { setResults([]); return; }
        let cancelled = false;
        hybridSearch(localQuery).then(ids => {
            if (cancelled) return;
            setResults(ids.map(id => allCardsMap.get(id)).filter((c): c is Card => c !== undefined && c.type !== 'course').slice(0, 6));
            setSelectedIndex(0);
        });
        return () => { cancelled = true; };
    }, [localQuery, allCardsMap, isSlash, isSystem]);

    // Keyboard nav
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!isOmniboxOpen) return;
            if (e.key === 'Escape') { setOmniboxOpen(false); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, Math.max(0, totalItems - 1))); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); return; }
            if (e.key === 'Enter') {
                e.preventDefault();
                const item = activeList[selectedIndex] as any;
                if (item?.action) { item.action(); if (isSystem) setOmniboxOpen(false); }
                else if (!isSlash && !isSystem) { setSearchQuery(localQuery); setOmniboxOpen(false); navigate('/browse'); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOmniboxOpen, isSlash, isSystem, activeList, selectedIndex, totalItems, localQuery, navigate, setOmniboxOpen, setSearchQuery]);

    // Scroll into view
    useEffect(() => {
        const el = listRef.current?.children[selectedIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (!isOmniboxOpen) return null;

    // Styles
    const s = {
        sectionLabel: {
            padding: '6px 14px 6px',
            fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' as const,
            letterSpacing: '0.09em', color: 'var(--color-text-muted)'
        },
        row: (sel: boolean) => ({
            display: 'flex', alignItems: 'center', gap: 14, padding: '9px 12px',
            borderRadius: 10, cursor: 'pointer', transition: 'background 0.1s',
            background: sel ? 'var(--color-bg)' : 'transparent'
        }),
        icon: (color: string, sel: boolean) => ({
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: sel ? color : `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: sel ? '#fff' : color, transition: 'all 0.15s'
        }),
        kbd: {
            fontSize: '0.68rem', padding: '2px 7px', borderRadius: 5,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)', fontWeight: 700 as const
        },
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '13vh' }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={() => setOmniboxOpen(false)}
            />

            {/* Panel */}
            <div style={{
                position: 'relative', width: '100%', maxWidth: 680,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                animation: 'omniboxIn 0.14s ease-out'
            }}>

                {/* ── Input ── */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', gap: 12 }}>
                    {isSlash
                        ? <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-primary)', minWidth: 22, textAlign: 'center', lineHeight: 1 }}>/</span>
                        : isSystem
                            ? <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text-muted)', minWidth: 22, textAlign: 'center', lineHeight: 1 }}>{'>'}</span>
                            : <MagnifyingGlass size={20} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    }
                    <input
                        ref={inputRef}
                        type="text"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}
                        placeholder={
                            isSlash ? 'carte · cours · flash · cloze · revision · tag: · type:…'
                            : isSystem ? 'Commande système…'
                            : 'Rechercher…  ou  /  pour créer,  >  pour les commandes'
                        }
                        value={localQuery}
                        onChange={e => { setLocalQuery(e.target.value); setSelectedIndex(0); }}
                    />
                    {localQuery && (
                        <button onClick={() => setLocalQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                            <X size={17} />
                        </button>
                    )}
                    {isSlash && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#6366f1', letterSpacing: '0.05em', flexShrink: 0 }}>CRÉATION</span>
                    )}
                    {isSystem && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'var(--color-bg)', color: 'var(--color-text-muted)', letterSpacing: '0.05em', flexShrink: 0 }}>SYSTÈME</span>
                    )}
                </div>

                {/* ── Results ── */}
                <div style={{ maxHeight: '56vh', overflowY: 'auto' }} className="custom-scrollbar" ref={listRef}>

                    {/* Empty state */}
                    {localQuery.trim() === '' && (
                        <div style={{ padding: '20px 16px 18px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                                {[
                                    { label: '/ Créer', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', action: () => setLocalQuery('/') },
                                    { label: '> Commande', color: 'var(--color-text-muted)', bg: 'var(--color-bg)', border: 'var(--color-border)', action: () => setLocalQuery('>') },
                                ].map(p => (
                                    <button key={p.label} onClick={p.action} style={{ padding: '6px 16px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.border}`, cursor: 'pointer' }}>{p.label}</button>
                                ))}
                                {dueCount > 0 && (
                                    <button onClick={() => { setOmniboxOpen(false); navigate('/review'); }} style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                                        🧠 {dueCount} à réviser
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Tapez pour rechercher dans votre base de connaissances</p>
                        </div>
                    )}

                    {/* Slash mode */}
                    {isSlash && !isFilterMode && (
                        <div style={{ padding: '8px' }}>
                            <div style={s.sectionLabel}>Créer</div>
                            {slashCommands.length === 0
                                ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Commande inconnue — <kbd style={s.kbd}>/carte</kbd> <kbd style={s.kbd}>/cours</kbd> <kbd style={s.kbd}>/flash</kbd></div>
                                : slashCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={() => cmd.action()}>
                                            <div style={s.icon(cmd.color, sel)}>{cmd.icon}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)' }}>{cmd.label}</div>
                                                <div style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{cmd.description}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {cmd.aliases.slice(0, 2).map(a => <kbd key={a} style={s.kbd}>/{a}</kbd>)}
                                            </div>
                                            {sel && <ArrowElbowDownLeft size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
                                        </div>
                                    );
                                })
                            }

                            <div style={{ ...s.sectionLabel, marginTop: 8 }}>Filtrer</div>
                            {[
                                { label: '/tag:', desc: 'Filtrer par étiquette', icon: <Tag size={16} />, color: '#14b8a6' },
                                { label: '/type:', desc: 'Filtrer par catégorie', icon: <Funnel size={16} />, color: '#f97316' },
                            ].map(f => (
                                <div key={f.label} style={{ ...s.row(false), transition: 'none' }} onClick={() => setLocalQuery(f.label)}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <div style={s.icon(f.color, false)}>{f.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                                            {f.label}<span style={{ opacity: 0.45 }}>valeur</span>
                                        </div>
                                        <div style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)' }}>{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter mode */}
                    {isSlash && isFilterMode && (
                        <div style={{ padding: '8px' }}>
                            <div style={s.sectionLabel}>{slashCmd.startsWith('tag:') ? 'Étiquettes' : 'Catégories'}</div>
                            {filterCommands.length === 0
                                ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Aucun résultat</div>
                                : filterCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={cmd.action}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{cmd.icon}</span>
                                            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{cmd.label}</span>
                                            {sel && <ArrowElbowDownLeft size={13} style={{ color: 'var(--color-text-muted)' }} />}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {/* System mode */}
                    {isSystem && (
                        <div style={{ padding: '8px' }}>
                            <div style={s.sectionLabel}>Commandes système</div>
                            {filteredSystemCommands.length === 0
                                ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Commande inconnue</div>
                                : filteredSystemCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={() => { cmd.action(); setOmniboxOpen(false); }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{cmd.icon}</span>
                                            <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-text)' }}>{cmd.label}</span>
                                            {sel && <ArrowElbowDownLeft size={13} style={{ color: 'var(--color-text-muted)' }} />}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {/* Search results */}
                    {!isSlash && !isSystem && localQuery.trim() !== '' && (
                        <div style={{ padding: '8px' }}>
                            {results.length === 0 ? (
                                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <MagnifyingGlass size={28} style={{ opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                                    <p style={{ fontSize: '0.9rem' }}>Aucun résultat pour « {localQuery} »</p>
                                    <p style={{ fontSize: '0.78rem', marginTop: 6 }}>Tapez <kbd style={s.kbd}>/carte</kbd> pour créer une nouvelle fiche</p>
                                </div>
                            ) : (
                                <>
                                    <div style={s.sectionLabel}>Résultats</div>
                                    {results.map((card, idx) => {
                                        const sel = idx === selectedIndex;
                                        return (
                                            <div key={card.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)}
                                                onClick={() => { setSearchQuery(localQuery); setOmniboxOpen(false); navigate('/browse'); }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 9, background: getCategoryColor(card.type), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                                    <DynamicIcon name={getCategoryIcon(card.type)} size={15} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</span>
                                                        {card.subtitle && <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 5, background: 'var(--color-border)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{card.subtitle}</span>}
                                                    </div>
                                                    {card.content && <p style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stripMarkdown(card.content)}</p>}
                                                </div>
                                                {card.tags && card.tags.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                        {card.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: '0.66rem', padding: '2px 7px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>#{t}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div style={{ margin: '4px 2px', borderTop: '1px solid var(--color-border)' }} />
                                    <div style={{ ...s.row(selectedIndex === results.length), justifyContent: 'space-between' }}
                                        onMouseEnter={() => setSelectedIndex(results.length)}
                                        onClick={() => { setSearchQuery(localQuery); setOmniboxOpen(false); navigate('/browse'); }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--color-text)' }}>Voir tous les résultats pour « {localQuery} »</span>
                                        <ArrowRight size={15} style={{ color: 'var(--color-text-muted)' }} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <kbd style={s.kbd}>↑</kbd><kbd style={s.kbd}>↓</kbd> Naviguer
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <kbd style={s.kbd}>↵</kbd> Confirmer
                        </span>
                        {!isSlash && !isSystem && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <kbd style={{ ...s.kbd, color: 'var(--color-primary)', borderColor: 'var(--color-primary)', opacity: 0.8 }}>/</kbd>
                                Créer
                            </span>
                        )}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <kbd style={s.kbd}>Esc</kbd> Fermer
                    </span>
                </div>
            </div>

            <style>{`@keyframes omniboxIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }`}</style>
        </div>
    );
};
