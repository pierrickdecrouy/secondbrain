import React from 'react';
import { ArrowsDownUp, SquaresFour, Rows, Export } from '@phosphor-icons/react';
import type { Card } from '../../types';
import { COURSE_TYPE } from '../../types';

import type { AddDataMode } from '../../store/useUIStore';

export type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

interface BrowseToolbarProps {
    cards: Card[];
    sortedCards: Card[];
    activeFilters: string[];
    handleFilterToggle: (type: string) => void;
    getFilterLabel: (type: string) => string;
    getCategoryColor: (type: string) => string;
    setAddDataMode: (mode: AddDataMode) => void;
    isNetworkOnly: boolean;
    viewMode: 'grid' | 'list' | 'split' | 'network';
    setViewMode: (mode: 'grid' | 'list' | 'split' | 'network') => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    exportToAnki: (deckName: string, cards: Card[]) => Promise<void>;
    darkMode: boolean;
}

export const BrowseToolbar: React.FC<BrowseToolbarProps> = ({
    cards, sortedCards, activeFilters, handleFilterToggle,
    getFilterLabel, getCategoryColor, setAddDataMode,
    isNetworkOnly, viewMode, setViewMode,
    sortOption, setSortOption, exportToAnki, darkMode
}) => {
    return (
        <div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '32px 48px 16px 48px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                    onClick={() => handleFilterToggle('all')}
                    style={{ margin: 0, border: 'none', background: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-text)' : 'transparent', color: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-bg)' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Tous
                </button>
                {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                    const isActive = activeFilters.includes(type);
                    return (
                        <button
                            key={type}
                            className={`browse-filter-pill ${isActive ? 'active' : ''}`}
                            onClick={() => handleFilterToggle(type)}
                            style={{ margin: 0, border: 'none', background: isActive ? getCategoryColor(type) : 'transparent', color: isActive ? '#ffffff' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )
                })}
                {/* special filter for review mode */}
                {activeFilters.includes('needs-review') && (
                    <button
                        className="browse-filter-pill active"
                        onClick={() => handleFilterToggle('needs-review')}
                        style={{ margin: 0, border: 'none', background: 'var(--color-warning)', color: 'var(--color-surface)', fontWeight: 600, padding: '8px 20px', borderRadius: '12px', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        À réviser
                    </button>
                )}
            </div>

            <div className="browse-toolbar-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Add Button */}
                <button
                    onClick={() => setAddDataMode('create')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onFocus={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onBlur={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    + Nouvelle Fiche
                </button>

                {/* Sort Options */}
                {!isNetworkOnly && viewMode !== 'network' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowsDownUp size={16} color="var(--color-text-muted)" />
                        <div style={{ position: 'relative' }}>
                            <select 
                                value={sortOption} 
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                style={{
                                    appearance: 'none',
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '6px 12px 6px 32px',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            >
                                <option value="name-asc">Nom (A-Z)</option>
                                <option value="name-desc">Nom (Z-A)</option>
                                <option value="type">Catégorie</option>
                                <option value="date-created-desc">Plus récents (Création)</option>
                                <option value="date-created-asc">Plus anciens (Création)</option>
                                <option value="date-modified-desc">Dernière modif.</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* View Toggle */}
                {!isNetworkOnly && (
                    <div className="flex items-center gap-1 rounded-[10px] p-1" style={{ background: darkMode ? '#1A2235' : '#e2e8f0' }}>
                        <button
                            className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'grid' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'grid' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        >
                            <SquaresFour size={16} /> Grille
                        </button>
                        <button
                            className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'list' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'list' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        >
                            <Rows size={16} /> Liste
                        </button>

                        <button
                            className={`browse-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                            onClick={() => setViewMode('split')}
                            style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'split' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'split' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'split' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        >
                            <SquaresFour size={16} /> Mixte
                        </button>
                    </div>
                )}
                
                {/* Export Anki */}
                <button
                    onClick={() => exportToAnki('My_Deck', sortedCards).catch(err => console.error("Anki export error:", err))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-text-muted)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    onFocus={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-text-muted)'; }}
                    onBlur={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    title="Exporter ces cartes vers Anki"
                >
                    <Export size={16} /> Export Anki
                </button>
            </div>
        </div>
    );
};
