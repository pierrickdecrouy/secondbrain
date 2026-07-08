import React, { useState } from 'react';
import { ArrowsDownUp, SquaresFour, Rows, Export, Plus, SpinnerGap } from '@phosphor-icons/react';
import type { Card } from '../../types';
import { COURSE_TYPE } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTier } from '../../lib/useTier';
import toast from 'react-hot-toast';

import type { AddDataMode } from '../../store/useUIStore';

export type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

interface BrowseToolbarProps {
    cards: Card[];
    sortedCards: Card[];
    activeFilters: string[];
    handleFilterToggle: (type: string) => void;
    getFilterLabel: (type: string) => string;
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
    getFilterLabel, setAddDataMode,
    isNetworkOnly, viewMode, setViewMode,
    sortOption, setSortOption, exportToAnki, darkMode
}) => {
    const { getCategoryColor } = useTheme();
    const { canAccess } = useTier();
    const canExportAnki = canAccess('anki_export');

    const [isExporting, setIsExporting] = useState(false);

    const handleAnkiExport = async () => {
        if (!canExportAnki) {
            toast.error('Export Anki réservé aux abonnés Pro. Activez votre licence dans les paramètres.', {
                duration: 4000,
                icon: '🔒',
            });
            return;
        }
        if (sortedCards.length === 0) {
            toast.error('Aucune fiche à exporter.');
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading(`Export de ${sortedCards.length} fiche${sortedCards.length > 1 ? 's' : ''}…`);

        try {
            await exportToAnki('SecondBrain', sortedCards);
            toast.success(`${sortedCards.length} fiche${sortedCards.length > 1 ? 's' : ''} exportée${sortedCards.length > 1 ? 's' : ''} avec succès !`, {
                id: toastId,
                icon: '✅',
                duration: 3000,
            });
        } catch (err: any) {
            console.error('Anki export error:', err);
            toast.error(err?.message ?? 'Erreur lors de l\'export Anki.', {
                id: toastId,
                duration: 4000,
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="browse-toolbar w-full max-w-[1600px] mx-auto self-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '20px 40px 20px 40px' }}>
            <div className="hover-scrollbar" style={{ display: 'flex', gap: '4px', background: darkMode ? '#1e293b' : '#f1f5f9', padding: '4px', borderRadius: '12px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflowX: 'auto', flexWrap: 'nowrap', maxWidth: '600px' }}>
                <button
                    className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                    onClick={() => handleFilterToggle('all')}
                    style={{ margin: 0, border: 'none', background: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-surface)' : 'transparent', color: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: (activeFilters.length === 0 || activeFilters.includes('all')) ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', whiteSpace: 'nowrap' }}
                >
                    Tous
                </button>
                {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                    const isActive = activeFilters.includes(type);
                    const typeColor = getCategoryColor(type);
                    return (
                        <button
                            key={type}
                            className={`browse-filter-pill ${isActive ? 'active' : ''}`}
                            onClick={() => handleFilterToggle(type)}
                            style={{ margin: 0, border: 'none', background: isActive ? `${typeColor}1A` : 'transparent', color: isActive ? typeColor : 'var(--color-text-muted)', fontWeight: isActive ? 600 : 500, padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? `0 0 0 1px ${typeColor}33` : 'none', whiteSpace: 'nowrap' }}
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
                        style={{ margin: 0, border: 'none', background: 'var(--color-warning)', color: 'var(--color-surface)', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    >
                        À réviser
                    </button>
                )}
            </div>

            <div className="browse-toolbar-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Add Button */}
                <button
                    onClick={() => setAddDataMode('create')}
                    className="extnd-btn extnd-btn-primary"
                    style={{ borderRadius: '12px' }}
                >
                    <Plus size={16} />
                    Nouvelle Fiche
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

                {/* Export Anki — with tier check, loading state, and toast feedback */}
                <button
                    onClick={handleAnkiExport}
                    disabled={isExporting}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: canExportAnki ? 'transparent' : (darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'),
                        color: canExportAnki ? 'var(--color-text-muted)' : '#818cf8',
                        border: `1px solid ${canExportAnki ? 'var(--color-border)' : 'rgba(99,102,241,0.3)'}`,
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: isExporting ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isExporting ? 0.7 : 1,
                    }}
                    onMouseOver={(e) => {
                        if (!isExporting) {
                            e.currentTarget.style.color = canExportAnki ? 'var(--color-text)' : '#a5b4fc';
                            e.currentTarget.style.borderColor = canExportAnki ? 'var(--color-text-muted)' : 'rgba(99,102,241,0.5)';
                        }
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.color = canExportAnki ? 'var(--color-text-muted)' : '#818cf8';
                        e.currentTarget.style.borderColor = canExportAnki ? 'var(--color-border)' : 'rgba(99,102,241,0.3)';
                    }}
                    title={canExportAnki ? `Exporter ${sortedCards.length} fiche${sortedCards.length > 1 ? 's' : ''} vers Anki` : 'Fonctionnalité Pro — Activez votre licence'}
                >
                    {isExporting ? (
                        <SpinnerGap size={16} className="animate-spin" />
                    ) : (
                        <>
                            {!canExportAnki && <span style={{ fontSize: '12px' }}>🔒</span>}
                            <Export size={16} />
                        </>
                    )}
                    {isExporting ? 'Export…' : 'Anki'}
                </button>
            </div>
        </div>
    );
};
