import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, X, ArrowRight, Moon, Sun, Plus, GraduationCap, ChartBar, Brain, TerminalWindow } from '@phosphor-icons/react';
import { useUI } from '../context/UIContext';
import { useCards } from '../context/CardContext';
import { useTheme } from '../context/ThemeContext';
import { stripMarkdown } from '../utils';
import { DynamicIcon } from './DynamicIcon';
import { hybridSearch } from '../searchIndex';
import type { Card } from '../types';

export const GlobalOmnibox: React.FC = () => {
    const { isOmniboxOpen, setOmniboxOpen, searchQuery, setSearchQuery } = useUI();
    const { cards } = useCards();
    const { getCategoryIcon, getCategoryColor, setThemeMode } = useTheme();
    const { setAddDataMode } = useUI();
    const navigate = useNavigate();
    
    const inputRef = useRef<HTMLInputElement>(null);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [results, setResults] = useState<Card[]>([]);
    const [commandResults, setCommandResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const isCommandMode = localQuery.trim().startsWith('>');

    const AVAILABLE_COMMANDS = [
        { id: 'theme-dark', label: 'Passer au thème Sombre', icon: <Moon size={16} />, action: () => setThemeMode('dark'), keywords: ['sombre', 'dark', 'nuit'] },
        { id: 'theme-light', label: 'Passer au thème Clair', icon: <Sun size={16} />, action: () => setThemeMode('light'), keywords: ['clair', 'light', 'jour'] },
        { id: 'new-card', label: 'Nouvelle fiche', icon: <Plus size={16} />, action: () => setAddDataMode('create'), keywords: ['nouvelle', 'new', 'creer', 'fiche', 'carte'] },
        { id: 'new-course', label: 'Nouveau cours', icon: <GraduationCap size={16} />, action: () => { setAddDataMode('create'); /* Wait, need to somehow specify it's a course */ }, keywords: ['cours', 'course'] },
        { id: 'stats', label: 'Voir les statistiques', icon: <ChartBar size={16} />, action: () => navigate('/stats'), keywords: ['stats', 'statistiques'] },
        { id: 'review', label: 'Lancer une révision', icon: <Brain size={16} />, action: () => navigate('/review'), keywords: ['revision', 'review', 'reviser'] },
    ];

    // Sync local query when opening
    useEffect(() => {
        if (isOmniboxOpen) {
            setLocalQuery(searchQuery);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOmniboxOpen, searchQuery]);

    // Live search
    useEffect(() => {
        if (!localQuery.trim()) {
            setResults([]);
            setCommandResults([]);
            return;
        }
        
        if (localQuery.trim().startsWith('>')) {
            const cmdQuery = localQuery.trim().substring(1).trim().toLowerCase();
            if (!cmdQuery) {
                setCommandResults(AVAILABLE_COMMANDS);
            } else {
                const filtered = AVAILABLE_COMMANDS.filter(cmd => 
                    cmd.label.toLowerCase().includes(cmdQuery) || 
                    cmd.keywords.some(k => k.includes(cmdQuery))
                );
                setCommandResults(filtered);
            }
            setSelectedIndex(0);
            return;
        }

        hybridSearch(localQuery).then(ids => {
            const matchedCards = ids
                .map(id => cards.find(c => c.id === id))
                .filter((c): c is Card => c !== undefined && c.type !== 'course')
                .slice(0, 6); // Max 6 quick results
                
            setResults(matchedCards);
            setSelectedIndex(0);
        });
    }, [localQuery, cards]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOmniboxOpen) return;
            
            const maxIndex = isCommandMode ? commandResults.length - 1 : results.length;

            if (e.key === 'Escape') {
                setOmniboxOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                
                if (isCommandMode) {
                    if (commandResults[selectedIndex]) {
                        commandResults[selectedIndex].action();
                        setOmniboxOpen(false);
                    }
                    return;
                }

                if (selectedIndex === results.length || results.length === 0) {
                    // Search all
                    setSearchQuery(localQuery);
                    setOmniboxOpen(false);
                    navigate('/browse');
                } else {
                    // Open specific card
                    setSearchQuery(localQuery); // Keep the search
                    setOmniboxOpen(false);
                    navigate('/browse'); // Go to browse, let BrowsePage open it or just let BrowsePage show the filtered list
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOmniboxOpen, results, commandResults, isCommandMode, selectedIndex, localQuery, navigate, setOmniboxOpen, setSearchQuery]);

    if (!isOmniboxOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh]">
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOmniboxOpen(false)}
            />
            
            <div 
                className="relative w-full max-w-2xl bg-[var(--color-surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border)] animate-in fade-in slide-in-from-top-4 duration-200"
            >
                {/* Input Area */}
                <div className="flex items-center px-4 py-4 border-b border-[var(--color-border)]">
                    <MagnifyingGlass size={24} className="text-[var(--color-text-muted)] ml-2 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-lg font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                        placeholder="Rechercher un médicament, ou tapez > pour une commande..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                    />
                    {localQuery && (
                        <button 
                            className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
                            onClick={() => setLocalQuery('')}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {localQuery.trim() === '' ? (
                        <div className="py-12 text-center text-[var(--color-text-muted)]">
                            <p>Tapez pour rechercher dans votre base de connaissances.</p>
                            <p className="mt-2 text-sm">Astuce : tapez <kbd className="px-1 py-0.5 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">&gt;</kbd> pour lancer des commandes (Thème, Nouvelle fiche...)</p>
                        </div>
                    ) : isCommandMode ? (
                        <div className="flex flex-col gap-1">
                            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
                                <TerminalWindow size={14} /> Commandes
                            </div>
                            
                            {commandResults.length === 0 ? (
                                <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">
                                    Commande inconnue
                                </div>
                            ) : (
                                commandResults.map((cmd, idx) => {
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <div 
                                            key={cmd.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-[var(--color-bg)] text-primary' : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'}`}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            onClick={() => {
                                                cmd.action();
                                                setOmniboxOpen(false);
                                            }}
                                        >
                                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[var(--color-surface)] shadow-sm' : 'bg-transparent'}`}>
                                                {cmd.icon}
                                            </div>
                                            <div className="flex-1 font-medium">{cmd.label}</div>
                                            <kbd className="text-xs text-[var(--color-text-muted)] hidden sm:inline-block px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">↵</kbd>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-12 text-center text-[var(--color-text-muted)]">
                            <p>Aucun résultat pour "{localQuery}"</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                                Aperçu rapide
                            </div>
                            
                            {results.map((card, idx) => {
                                const isSelected = idx === selectedIndex;
                                return (
                                    <div 
                                        key={card.id}
                                        className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-[var(--color-bg)]' : 'hover:bg-[var(--color-bg)]'}`}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        onClick={() => {
                                            setSearchQuery(localQuery);
                                            setOmniboxOpen(false);
                                            navigate('/browse');
                                        }}
                                    >
                                        <div 
                                            className="mt-1 flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                                            style={{ 
                                                backgroundColor: getCategoryColor(card.type),
                                                color: 'var(--color-surface)'
                                            }}
                                        >
                                            <DynamicIcon name={getCategoryIcon(card.type)} size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[var(--color-text)] font-semibold truncate">{card.title}</h4>
                                                {card.subtitle && (
                                                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--color-border)] text-[var(--color-text-muted)] truncate">
                                                        {card.subtitle}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                                                {stripMarkdown(card.content)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div className="my-1 border-t border-[var(--color-border)]" />
                            
                            <div 
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${selectedIndex === results.length ? 'bg-[var(--color-bg)]' : 'hover:bg-[var(--color-bg)]'}`}
                                onMouseEnter={() => setSelectedIndex(results.length)}
                                onClick={() => {
                                    setSearchQuery(localQuery);
                                    setOmniboxOpen(false);
                                    navigate('/browse');
                                }}
                            >
                                <span className="text-[var(--color-text)] font-medium">
                                    Voir tous les résultats pour "{localQuery}"
                                </span>
                                <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer hints */}
                <div className="px-4 py-3 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↑</kbd><kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↓</kbd> Naviguer</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↵</kbd> Ouvrir</span>
                    </div>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">Esc</kbd> Fermer</span>
                </div>
            </div>
        </div>
    );
};
