import React, { useState } from 'react';
import { ArrowsDownUp, SquaresFour, Rows, Export, Plus, SpinnerGap } from '@phosphor-icons/react';
import type { Card } from '../../types';
import { COURSE_TYPE } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTier } from '../../lib/useTier';
import toast from 'react-hot-toast';



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
}

export const BrowseToolbar: React.FC<BrowseToolbarProps> = ({
    cards, sortedCards, activeFilters, handleFilterToggle,
    getFilterLabel, onAdd,
    isNetworkOnly, viewMode, setViewMode,
    sortOption, setSortOption, exportToAnki
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
        <div className="browse-toolbar w-full max-w-[1600px] mx-auto self-center flex flex-wrap gap-4 items-center px-10 py-5" >
            <div className="hover-scrollbar flex gap-2 p-1.5 rounded-xl overflow-x-auto flex-nowrap max-w-[700px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]">
                <button
                    className={`px-5 py-2 rounded-lg text-[14px] font-bold transition-all duration-200 border-none cursor-pointer outline-none whitespace-nowrap flex items-center justify-center ${activeFilters.length === 0 || activeFilters.includes('all') ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                    onClick={() => handleFilterToggle('all')}
                >
                    Tous
                </button>
                {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                    const isActive = activeFilters.includes(type);
                    const typeColor = getCategoryColor(type);
                    return (
                        <button
                            key={type}
                            className={`px-5 py-2 rounded-lg text-[14px] font-bold transition-all duration-200 border-none cursor-pointer outline-none whitespace-nowrap flex items-center justify-center ${!isActive ? 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50' : ''}`}
                            onClick={() => handleFilterToggle(type)}
                            style={isActive ? {
                                background: `color-mix(in srgb, ${typeColor} 15%, transparent)`,
                                color: typeColor,
                                boxShadow: `0 0 0 1px color-mix(in srgb, ${typeColor} 30%, transparent)`
                            } : {}}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )
                })}
                {/* special filter for review mode */}
                {activeFilters.includes('needs-review') && (
                    <button
                        className="m-0 border-none bg-amber-500 text-white font-bold px-5 py-2 rounded-lg text-[14px] cursor-pointer transition-all duration-200 whitespace-nowrap flex items-center justify-center shadow-sm"
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
                    className="flex items-center justify-center gap-2.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 border-none cursor-pointer outline-none"
                >
                    <Plus size={18} weight="bold" />
                    Nouvelle Fiche
                </button>

                {/* Sort Options */}
                {!isNetworkOnly && viewMode !== 'network' && (
                    <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm hover:border-slate-300 transition-colors">
                        <ArrowsDownUp size={16} className="text-slate-400 mr-2" weight="bold" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="appearance-none border-none bg-transparent text-[14px] text-slate-700 dark:text-slate-200 font-bold cursor-pointer outline-none pr-4 w-full h-[40px]"
                        >
                            <option value="name-asc">Nom (A-Z)</option>
                            <option value="name-desc">Nom (Z-A)</option>
                            <option value="type">Catégorie</option>
                            <option value="date-created-desc">Plus récents (Création)</option>
                            <option value="date-created-asc">Plus anciens (Création)</option>
                            <option value="date-modified-desc">Dernière modif.</option>
                        </select>
                    </div>
                )}

                {/* View Toggle */}
                {!isNetworkOnly && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl h-max bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`m-0 px-4 py-2 rounded-lg border-none text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <SquaresFour size={18} weight={viewMode === 'grid' ? "fill" : "regular"} /> Grille
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`m-0 px-4 py-2 rounded-lg border-none text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <Rows size={18} weight={viewMode === 'list' ? "fill" : "regular"} /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`m-0 px-4 py-2 rounded-lg border-none text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 outline-none ${viewMode === 'split' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <SquaresFour size={18} weight={viewMode === 'split' ? "fill" : "regular"} /> Mixte
                        </button>
                    </div>
                )}

                {/* Export Anki — with tier check, loading state, and toast feedback */}
                <button
                    onClick={handleAnkiExport}
                    disabled={isExporting}
                    className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-200 border-none outline-none ${isExporting ? 'cursor-wait opacity-70' : 'cursor-pointer opacity-100'} ${canExportAnki ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:border-slate-300 dark:hover:border-slate-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'}`}
                    title={canExportAnki ? `Exporter ${sortedCards.length} fiche${sortedCards.length > 1 ? 's' : ''} vers Anki` : 'Fonctionnalité Pro — Activez votre licence'}
                >
                    {isExporting ? (
                        <SpinnerGap size={18} className="animate-spin" />
                    ) : (
                        <>
                            {!canExportAnki && <span className="text-[12px]">🔒</span>}
                            <Export size={18} />
                        </>
                    )}
                    {isExporting ? 'Export…' : 'Anki'}
                </button>
            </div>
        </div>
    );
};
