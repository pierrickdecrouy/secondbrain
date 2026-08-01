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
import { hybridSearch, fastLexicalSearch } from '../searchIndex';
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
    const [highlights, setHighlights] = useState<Record<string, string>>({});
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDeepSearch, setIsDeepSearch] = useState(false);

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
            setHighlights({});
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOmniboxOpen]);

    // Memoize card map for faster O(1) lookups instead of O(N*M)
    const allCardsMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    // Live search
    useEffect(() => {
        if (!localQuery.trim() || isSlash || isSystem) { setResults([]); setHighlights({}); return; }
        let cancelled = false;
        
        const wordCount = localQuery.trim().split(/\s+/).length;
        
        if (wordCount > 3) {
            setIsDeepSearch(true);
            hybridSearch(localQuery).then(ids => {
                if (cancelled) return;
                setResults(ids.map(id => allCardsMap.get(id)).filter((c): c is Card => c !== undefined && c.type !== 'course').slice(0, 6));
                setHighlights({});
                setSelectedIndex(0);
            });
        } else {
            setIsDeepSearch(false);
            fastLexicalSearch(localQuery).then(ftsResults => {
                if (cancelled) return;
                
                const mapped = ftsResults.map(res => {
                    const card = allCardsMap.get(res.id);
                    if (card && card.type !== 'course') {
                        return { card, highlight: res.highlight };
                    }
                    return null;
                }).filter(item => item !== null) as { card: Card, highlight: string }[];
                
                const justCards = mapped.map(m => m.card).slice(0, 6);
                const justHighlights = mapped.reduce((acc, m) => {
                    acc[m.card.id] = m.highlight;
                    return acc;
                }, {} as Record<string, string>);
                
                setResults(justCards);
                setHighlights(justHighlights);
                setSelectedIndex(0);
            });
        }
        
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
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[13vh]" >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
                onClick={() => setOmniboxOpen(false)}
            />

            {/* Panel */}
            <div className="relative w-full max-w-[680px] flex flex-col overflow-hidden rounded-[20px] shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" >

                {/* ── Input ── */}
                <div className="flex items-center px-5 py-4 border-b border-slate-200 dark:border-slate-800 gap-3" >
                    {isSlash
                        ? <span className="text-[1.15rem] font-black text-teal-600 dark:text-teal-500 min-w-[22px] text-center leading-none" >/</span>
                        : isSystem
                            ? <span className="text-[1.15rem] font-black text-slate-400 dark:text-slate-500 min-w-[22px] text-center leading-none" >{'>'}</span>
                            : <MagnifyingGlass size={20} className="text-slate-400 dark:text-slate-500 shrink-0"  />
                    }
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-[1.05rem] font-semibold text-slate-900 dark:text-slate-100" 
                        placeholder={
                            isSlash ? 'carte · cours · flash · cloze · revision · tag: · type:…'
                            : isSystem ? 'Commande système…'
                            : 'Rechercher (Lexical < 4 mots, Sémantique ≥ 4 mots)'
                        }
                        value={localQuery}
                        onChange={e => { setLocalQuery(e.target.value); setSelectedIndex(0); }}
                    />
                    {localQuery && (
                        <button onClick={() => setLocalQuery('')} className="bg-transparent border-none cursor-pointer text-slate-400 dark:text-slate-500 p-1 rounded-md flex items-center hover:bg-slate-100 dark:hover:bg-slate-800" >
                            <X size={17} />
                        </button>
                    )}
                    {isSlash && (
                        <span className="text-[0.7rem] font-extrabold px-2.5 py-[3px] rounded-full bg-indigo-500/10 text-indigo-500 tracking-wider shrink-0" >CRÉATION</span>
                    )}
                    {isSystem && (
                        <span className="text-[0.7rem] font-extrabold px-2.5 py-[3px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 tracking-wider shrink-0" >SYSTÈME</span>
                    )}
                </div>

                {/* ── Results ── */}
                <div  className="custom-scrollbar max-h-[56vh] overflow-y-auto" ref={listRef}>

                    {/* Empty state */}
                    {localQuery.trim() === '' && (
                        <div className="px-4 pt-5 pb-[18px]" >
                            <div className="flex flex-wrap gap-2 mb-[18px]" >
                                {[
                                    { label: '/ Créer', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', action: () => setLocalQuery('/') },
                                    { label: '> Commande', color: 'var(--color-text-muted)', bg: 'var(--color-bg)', border: 'var(--color-border)', action: () => setLocalQuery('>') },
                                ].map(p => (
                                    <button key={p.label} onClick={p.action} className="px-4 py-1.5 rounded-full text-[0.82rem] font-bold cursor-pointer" style={{
  background: p.bg,
  color: p.color,
  border: `1px solid ${p.border}`
}}>{p.label}</button>
                                ))}
                                {dueCount > 0 && (
                                    <button onClick={() => { setOmniboxOpen(false); navigate('/review'); }} className="px-[14px] py-1.5 rounded-full text-[0.82rem] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 cursor-pointer" >
                                        🧠 {dueCount} à réviser
                                    </button>
                                )}
                            </div>
                            <p className="text-[0.83rem] text-slate-400 dark:text-slate-500 text-center" >Tapez pour rechercher dans votre base de connaissances</p>
                        </div>
                    )}

                    {/* Slash mode */}
                    {isSlash && !isFilterMode && (
                        <div className="p-2" >
                            <div style={s.sectionLabel}>Créer</div>
                            {slashCommands.length === 0
                                ? <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-[0.88rem]" >Commande inconnue — <kbd style={s.kbd}>/carte</kbd> <kbd style={s.kbd}>/cours</kbd> <kbd style={s.kbd}>/flash</kbd></div>
                                : slashCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={() => cmd.action()}>
                                            <div style={s.icon(cmd.color, sel)}>{cmd.icon}</div>
                                            <div className="flex-1 min-w-0" >
                                                <div className="font-bold text-[0.92rem] text-slate-900 dark:text-slate-100" >{cmd.label}</div>
                                                <div className="text-[0.77rem] text-slate-400 dark:text-slate-500 mt-[1px]" >{cmd.description}</div>
                                            </div>
                                            <div className="flex gap-1" >
                                                {cmd.aliases.slice(0, 2).map(a => <kbd key={a} style={s.kbd}>/{a}</kbd>)}
                                            </div>
                                            {sel && <ArrowElbowDownLeft size={13} className="text-slate-400 dark:text-slate-500 shrink-0"  />}
                                        </div>
                                    );
                                })
                            }

                            <div className="mt-2" style={{
  ...s.sectionLabel
}}>Filtrer</div>
                            {[
                                { label: '/tag:', desc: 'Filtrer par étiquette', icon: <Tag size={16} />, color: '#14b8a6' },
                                { label: '/type:', desc: 'Filtrer par catégorie', icon: <Funnel size={16} />, color: '#f97316' },
                            ].map(f => (
                                <div key={f.label} className="transition-none" style={{
  ...s.row(false)
}} onClick={() => setLocalQuery(f.label)}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <div style={s.icon(f.color, false)}>{f.icon}</div>
                                    <div className="flex-1" >
                                        <div className="font-bold text-[0.88rem] text-slate-900 dark:text-slate-100" >
                                            {f.label}<span className="opacity-45" >valeur</span>
                                        </div>
                                        <div className="text-[0.77rem] text-slate-400 dark:text-slate-500" >{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter mode */}
                    {isSlash && isFilterMode && (
                        <div className="p-2" >
                            <div style={s.sectionLabel}>{slashCmd.startsWith('tag:') ? 'Étiquettes' : 'Catégories'}</div>
                            {filterCommands.length === 0
                                ? <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-[0.88rem]" >Aucun résultat</div>
                                : filterCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={cmd.action}>
                                            <span className="text-slate-400 dark:text-slate-500" >{cmd.icon}</span>
                                            <span className="flex-1 font-semibold text-[0.9rem] text-slate-900 dark:text-slate-100" >{cmd.label}</span>
                                            {sel && <ArrowElbowDownLeft size={13} className="text-slate-400 dark:text-slate-500"  />}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {/* System mode */}
                    {isSystem && (
                        <div className="p-2" >
                            <div style={s.sectionLabel}>Commandes système</div>
                            {filteredSystemCommands.length === 0
                                ? <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-[0.88rem]" >Commande inconnue</div>
                                : filteredSystemCommands.map((cmd, idx) => {
                                    const sel = idx === selectedIndex;
                                    return (
                                        <div key={cmd.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)} onClick={() => { cmd.action(); setOmniboxOpen(false); }}>
                                            <span className="text-slate-400 dark:text-slate-500" >{cmd.icon}</span>
                                            <span className="flex-1 font-semibold text-slate-900 dark:text-slate-100" >{cmd.label}</span>
                                            {sel && <ArrowElbowDownLeft size={13} className="text-slate-400 dark:text-slate-500"  />}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {/* Search results */}
                    {!isSlash && !isSystem && localQuery.trim() !== '' && (
                        <div className="p-2" >
                            {results.length === 0 ? (
                                <div className="px-6 py-8 text-center text-slate-400 dark:text-slate-500" >
                                    <MagnifyingGlass size={28} className="opacity-25 block mx-auto mb-2.5"  />
                                    <p className="text-[0.9rem]" >Aucun résultat pour « {localQuery} »</p>
                                    <p className="text-[0.78rem] mt-1.5" >Tapez <kbd style={s.kbd}>/carte</kbd> pour créer une nouvelle fiche</p>
                                </div>
                            ) : (
                                <>
                                    <div style={s.sectionLabel}>Résultats</div>
                                    {results.map((card, idx) => {
                                        const sel = idx === selectedIndex;
                                        return (
                                            <div key={card.id} style={s.row(sel)} onMouseEnter={() => setSelectedIndex(idx)}
                                                onClick={() => { setSearchQuery(localQuery); setOmniboxOpen(false); navigate('/browse'); }}>
                                                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white shrink-0" style={{
  background: getCategoryColor(card.type)
}}>
                                                    <DynamicIcon name={getCategoryIcon(card.type)} size={15} />
                                                </div>
                                                <div className="flex-1 min-w-0" >
                                                    <div className="flex items-center gap-[7px]" >
                                                        <span className="font-bold text-[0.9rem] text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap" >{card.title}</span>
                                                        {card.subtitle && <span className="text-[0.7rem] px-[7px] py-[2px] rounded-[5px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0" >{card.subtitle}</span>}
                                                    </div>
                                                    
                                                    {highlights[card.id] ? (
                                                        <p 
                                                            className="text-[0.77rem] text-slate-400 dark:text-slate-500 mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap" 
                                                            dangerouslySetInnerHTML={{ __html: highlights[card.id] }}
                                                        />
                                                    ) : (
                                                        card.content && <p className="text-[0.77rem] text-slate-400 dark:text-slate-500 mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap" >{stripMarkdown(card.content)}</p>
                                                    )}
                                                </div>
                                                {card.tags && card.tags.length > 0 && (
                                                    <div className="flex gap-1 shrink-0" >
                                                        {card.tags.slice(0, 2).map(t => <span key={t} className="text-[0.66rem] px-[7px] py-[2px] rounded-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500" >#{t}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="my-1 mx-0.5 border-t border-slate-200 dark:border-slate-800"  />
                                    <div className="justify-between" style={{
  ...s.row(selectedIndex === results.length)
}}
                                        onMouseEnter={() => setSelectedIndex(results.length)}
                                        onClick={() => { setSearchQuery(localQuery); setOmniboxOpen(false); navigate('/browse'); }}>
                                        <div className="flex items-center gap-1.5" >
                                            <span className="font-semibold text-[0.87rem] text-slate-900 dark:text-slate-100" >Voir tous les résultats pour « {localQuery} »</span>
                                            {isDeepSearch && <span className="text-[0.65rem] font-extrabold px-[6px] py-[2px] rounded-[20px] bg-emerald-500/10 text-emerald-500" >SÉMANTIQUE RRF</span>}
                                        </div>
                                        <ArrowRight size={15} className="text-slate-400 dark:text-slate-500"  />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-[18px] py-[9px] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[0.7rem] text-slate-400 dark:text-slate-500" >
                    <div className="flex items-center gap-[14px]" >
                        <span className="flex items-center gap-1" >
                            <kbd style={s.kbd}>↑</kbd><kbd style={s.kbd}>↓</kbd> Naviguer
                        </span>
                        <span className="flex items-center gap-1" >
                            <kbd style={s.kbd}>↵</kbd> Confirmer
                        </span>
                        {!isSlash && !isSystem && (
                            <span className="flex items-center gap-1" >
                                <kbd className="text-teal-600 dark:text-teal-500 border-teal-600 dark:border-teal-500 opacity-80" style={{
  ...s.kbd
}}>/</kbd>
                                Créer
                            </span>
                        )}
                    </div>
                    <span className="flex items-center gap-1" >
                        <kbd style={s.kbd}>Esc</kbd> Fermer
                    </span>
                </div>
            </div>

            <style>{`@keyframes omniboxIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }`}</style>
        </div>
    );
};
