import React from 'react';
import { ArrowsDownUp, SquaresFour, Rows, Plus } from '@phosphor-icons/react';
import type { Card } from '../../types';
import { COURSE_TYPE } from '../../types';
import { useTheme } from '../../context/ThemeContext';



export type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

interface BrowseToolbarProps {
    cards: Card[];
    activeFilters: string[];
    handleFilterToggle: (type: string) => void;
    getFilterLabel: (type: string) => string;
    onAdd: () => void;
    isNetworkOnly: boolean;
    viewMode: 'grid' | 'list' | 'split' | 'network';
    setViewMode: (mode: 'grid' | 'list' | 'split' | 'network') => void;
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
}

export const BrowseToolbar: React.FC<BrowseToolbarProps> = ({
    cards, activeFilters, handleFilterToggle,
    getFilterLabel, onAdd,
    isNetworkOnly, viewMode, setViewMode,
    sortOption, setSortOption
}) => {
    const { getCategoryColor } = useTheme();



    return (
        <div className="browse-toolbar w-full max-w-[1600px] mx-auto self-center flex flex-col sm:flex-row gap-4 sm:gap-3 items-start sm:items-center justify-between px-10 py-4" >
            <div className="hover-scrollbar flex gap-1.5 p-1.5 rounded-[16px] overflow-x-auto flex-nowrap shrink min-w-0 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)] max-w-full">
                <button
                    className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all duration-200 border-none cursor-pointer outline-none whitespace-nowrap flex items-center justify-center ${activeFilters.length === 0 || activeFilters.includes('all') ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
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
                            className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all duration-200 border-none cursor-pointer outline-none whitespace-nowrap flex items-center justify-center ${!isActive ? 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50' : ''}`}
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
                        className="m-0 border-none bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-[14px] cursor-pointer transition-all duration-200 whitespace-nowrap flex items-center justify-center shadow-sm"
                        onClick={() => handleFilterToggle('needs-review')}
                    >
                        À réviser
                    </button>
                )}
            </div>

            <div className="browse-toolbar-right flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                {/* Add Button */}
                <button
                    onClick={onAdd}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 border-none cursor-pointer outline-none"
                >
                    <Plus size={16} weight="bold" />
                    Nouvelle Fiche
                </button>



                {/* Sort Options */}
                {!isNetworkOnly && viewMode !== 'network' && (
                    <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm hover:border-slate-300 transition-colors">
                        <ArrowsDownUp size={14} className="text-slate-400 mr-1.5" weight="bold" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="appearance-none border-none bg-transparent text-[13px] text-slate-700 dark:text-slate-200 font-bold cursor-pointer outline-none pr-3 w-full h-[36px]"
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
                    <div className="flex items-center gap-1 p-1 rounded-xl h-max bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`m-0 px-3 py-1.5 rounded-lg border-none text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <SquaresFour size={16} weight={viewMode === 'grid' ? "fill" : "regular"} /> Grille
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`m-0 px-3 py-1.5 rounded-lg border-none text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <Rows size={16} weight={viewMode === 'list' ? "fill" : "regular"} /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`m-0 px-3 py-1.5 rounded-lg border-none text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 outline-none hidden sm:flex ${viewMode === 'split' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                        >
                            <SquaresFour size={18} weight={viewMode === 'split' ? "fill" : "regular"} /> Mixte
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
