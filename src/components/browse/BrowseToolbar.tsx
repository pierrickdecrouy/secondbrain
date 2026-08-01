import React, { useState } from 'react';
import { ArrowsDownUp, SquaresFour, Rows, Export, Plus, SpinnerGap } from '@phosphor-icons/react';
import type { Card } from '../../types';
import { COURSE_TYPE } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTier } from '../../lib/useTier';
import toast from 'react-hot-toast';
import './styles/BrowseToolbar.css';



export type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

interface BrowseToolbarProps {
    cards: Card[];
    sortedCards: Card[];
    activeFilters: string[];
    handleFilterToggle: (type: string) => void;
    getFilterLabel: (type: string) => string;
    onAdd: () => void;
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
    getFilterLabel, onAdd,
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
        <div className="browse-toolbar w-full max-w-[1600px] mx-auto self-center browsetoolbar-style-1" >
            <div className="hover-scrollbar browsetoolbar-style-2" style={{
  background: darkMode ? '#1e293b' : '#f1f5f9',
  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
}}>
                <button
                    className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''} browsetoolbar-style-3`}
                    onClick={() => handleFilterToggle('all')}
                    style={{
  background: activeFilters.length === 0 || activeFilters.includes('all') ? 'var(--color-surface)' : 'transparent',
  color: activeFilters.length === 0 || activeFilters.includes('all') ? 'var(--color-text)' : 'var(--color-text-muted)',
  boxShadow: activeFilters.length === 0 || activeFilters.includes('all') ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
}}
                >
                    Tous
                </button>
                {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                    const isActive = activeFilters.includes(type);
                    const typeColor = getCategoryColor(type);
                    return (
                        <button
                            key={type}
                            className={`browse-filter-pill ${isActive ? 'active' : ''} browsetoolbar-style-4`}
                            onClick={() => handleFilterToggle(type)}
                            style={{
  background: isActive ? `${typeColor}1A` : 'transparent',
  color: isActive ? typeColor : 'var(--color-text-muted)',
  fontWeight: isActive ? 600 : 500,
  boxShadow: isActive ? `0 0 0 1px ${typeColor}33` : 'none'
}}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )
                })}
                {/* special filter for review mode */}
                {activeFilters.includes('needs-review') && (
                    <button
                        className="browse-filter-pill active browsetoolbar-style-5"
                        onClick={() => handleFilterToggle('needs-review')}
                        
                    >
                        À réviser
                    </button>
                )}
            </div>

            <div className="browse-toolbar-right ml-auto flex items-center gap-4">
                {/* Add Button */}
                <button
                    onClick={onAdd}
                    className="extnd-btn extnd-btn-primary rounded-xl"
                >
                    <Plus size={16} />
                    Nouvelle Fiche
                </button>

                {/* Sort Options */}
                {!isNetworkOnly && viewMode !== 'network' && (
                    <div className="flex items-center gap-2">
                        <ArrowsDownUp size={16} color="var(--color-text-muted)" />
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="appearance-none border-none bg-transparent py-1.5 pr-3 pl-8 text-[0.9rem] text-[color:var(--color-text)] font-semibold cursor-pointer outline-none font-inherit"
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
                    <div 
                        className="flex items-center browsetoolbar-style-6" 
                        style={{
  background: darkMode ? '#1e293b' : '#f1f5f9',
  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
}}
                    >
                        <button
                            onClick={() => setViewMode('grid')}
                            className="browsetoolbar-style-7" style={{
  background: viewMode === 'grid' ? darkMode ? '#0f172a' : '#ffffff' : 'transparent',
  color: viewMode === 'grid' ? darkMode ? '#34d399' : '#059669' : darkMode ? '#94a3b8' : '#64748b',
  boxShadow: viewMode === 'grid' ? darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' : 'none'
}}
                        >
                            <SquaresFour size={16} /> Grille
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className="browsetoolbar-style-8" style={{
  background: viewMode === 'list' ? darkMode ? '#0f172a' : '#ffffff' : 'transparent',
  color: viewMode === 'list' ? darkMode ? '#34d399' : '#059669' : darkMode ? '#94a3b8' : '#64748b',
  boxShadow: viewMode === 'list' ? darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' : 'none'
}}
                        >
                            <Rows size={16} /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className="browsetoolbar-style-9" style={{
  background: viewMode === 'split' ? darkMode ? '#0f172a' : '#ffffff' : 'transparent',
  color: viewMode === 'split' ? darkMode ? '#34d399' : '#059669' : darkMode ? '#94a3b8' : '#64748b',
  boxShadow: viewMode === 'split' ? darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' : 'none'
}}
                        >
                            <SquaresFour size={16} /> Mixte
                        </button>
                    </div>
                )}

                {/* Export Anki — with tier check, loading state, and toast feedback */}
                <button
                    onClick={handleAnkiExport}
                    disabled={isExporting}
                    className={`extnd-btn rounded-xl transition-all duration-200 ${isExporting ? 'cursor-wait opacity-70' : 'cursor-pointer opacity-100'} ${canExportAnki ? 'extnd-btn-secondary' : 'bg-indigo-500/[0.06] dark:bg-indigo-500/[0.08] text-indigo-400 border border-indigo-500/30 hover:text-indigo-300 hover:border-indigo-500/50'}`}
                    title={canExportAnki ? `Exporter ${sortedCards.length} fiche${sortedCards.length > 1 ? 's' : ''} vers Anki` : 'Fonctionnalité Pro — Activez votre licence'}
                >
                    {isExporting ? (
                        <SpinnerGap size={16} className="animate-spin" />
                    ) : (
                        <>
                            {!canExportAnki && <span className="text-[12px]">🔒</span>}
                            <Export size={16} />
                        </>
                    )}
                    {isExporting ? 'Export…' : 'Anki'}
                </button>
            </div>
        </div>
    );
};
