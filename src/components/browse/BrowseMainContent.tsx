import React from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import type { Card } from '../../types';
import type { QualityAssessment } from '../../algorithms/qualityScoring';
import { BrowseGridItem } from '../BrowseGridItem';
import { BrowseListItem } from '../BrowseListItem';

interface BrowseMainContentProps {
    sortedCards: Card[];
    viewMode: 'grid' | 'list' | 'split' | 'network';
    selectedCardId: string | null;
    selectedCard: Card | null;
    darkMode: boolean;
    getCategoryColor: (type: string) => string;
    getCategoryIcon: (type: string) => string;
    calculateQualityScore: (card: Card, connectivityCount?: number) => QualityAssessment;
    activeFilters: string[];
    // Multi-select
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    // Navigation
    setSelectedCardId: (id: string | null) => void;
    setExpandedCardId: (id: string | null) => void;
    setCardToDelete: (card: Card | null) => void;
    setCardToEdit?: (card: Card) => void;
}

// ── Grid list wrapper ──────────────────────────────────────────────
const CustomGridList = React.forwardRef((props: any, ref) => {
    const { context, style, children, ...rest } = props;
    const { viewMode, gridColumns } = context || {};
    return (
        <div className="flex justify-center w-full pb-10">
            <div
                {...rest}
                ref={ref}
                style={{ ...style, display: undefined, flexWrap: undefined }}
                className={`grid gap-6 px-10 py-4 w-full ${viewMode !== 'split' ? 'max-w-[2000px]' : ''} ${gridColumns}`}
            >
                {children}
            </div>
        </div>
    );
});

// ── List rows wrapper ──────────────────────────────────────────────
const CustomListList = React.forwardRef((props: any, ref) => {
    const { style, children, ...rest } = props;
    return (
        <div
            {...rest}
            ref={ref}
            style={{ ...style }}
            className="flex flex-col min-w-0"
        >
            {children}
        </div>
    );
});

// ── Header columns ────────────────────────────────────────────────
const ListHeader: React.FC = () => (
    <div className="flex items-center border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 shrink-0 select-none px-7 py-3 gap-5" >
        <div className="shrink-0 w-5" />
        <div className="shrink-0 w-11" />
        <div className="flex-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Titre de la fiche
        </div>
        <div className="hidden sm:block shrink-0 w-[110px] text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Catégorie
        </div>
        <div className="hidden lg:block shrink-0 w-[200px] text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Tags
        </div>
        <div className="shrink-0 w-[76px]" />
    </div>
);

export const BrowseMainContent: React.FC<BrowseMainContentProps> = ({
    sortedCards, viewMode, selectedCardId, darkMode,
    getCategoryColor, getCategoryIcon, calculateQualityScore,
    activeFilters, isSelectionMode, selectedIds, onToggleSelect,
    setSelectedCardId, setExpandedCardId, setCardToDelete, setCardToEdit
}) => {
    const isGrid = viewMode === 'grid' || viewMode === 'split';

    // Ensure grid cards are not comically large on wide screens, but limit to 3 columns max
    const gridColumns = viewMode === 'split'
        ? 'grid-cols-1 xl:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

    return (
        <div
            className={`flex flex-col min-h-0 min-w-0 overflow-hidden ${viewMode === 'split' ? 'is-split' : ''}`}
            style={{ flex: viewMode === 'split' ? '0 0 55%' : 1 }}
        >
            {/* ── Grid / Split view ── */}
            {isGrid && (
                <div className="flex-1 min-h-0 flex flex-col">
                    {sortedCards.length === 0 ? (
                        <div className="text-center p-20 text-slate-400 font-medium">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <VirtuosoGrid
                            className="flex-1 custom-scrollbar"
                            totalCount={sortedCards.length}
                            data={sortedCards}
                            context={{ viewMode, gridColumns }}
                            components={{ List: CustomGridList }}
                            itemContent={(index, card) => (
                                <BrowseGridItem
                                    key={card.id}
                                    card={card}
                                    index={index}
                                    selectedCardId={isSelectionMode ? null : selectedCardId}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(card.id)}
                                    darkMode={darkMode}
                                    getCategoryColor={getCategoryColor}
                                    getCategoryIcon={getCategoryIcon}
                                    calculateQualityScore={calculateQualityScore}
                                    activeFilters={activeFilters}
                                    onSelect={(id) => { setSelectedCardId(id); }}
                                    onToggleSelect={onToggleSelect}
                                    onDelete={(_, e) => { e.stopPropagation(); setCardToDelete(card); }}
                                />
                            )}
                        />
                    )}
                </div>
            )}

            {/* ── List view ── */}
            {viewMode === 'list' && (
                <div className="flex-1 min-h-0 flex flex-col px-10 pb-8 max-w-[2000px] w-full mx-auto">
                    {sortedCards.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-[15px]">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden">
                            <ListHeader />

                            <VirtuosoGrid
                                className="flex-1 min-h-0 custom-scrollbar"
                                data={sortedCards}
                                components={{ List: CustomListList }}
                                itemContent={(index, card) => (
                                    <BrowseListItem
                                        key={card.id}
                                        card={card}
                                        index={index}
                                        selectedCardId={isSelectionMode ? null : selectedCardId}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.has(card.id)}
                                        darkMode={darkMode}
                                        getCategoryColor={getCategoryColor}
                                        getCategoryIcon={getCategoryIcon}
                                        calculateQualityScore={calculateQualityScore}
                                        activeFilters={activeFilters}
                                        onSelect={setSelectedCardId}
                                        onDoubleSelect={setExpandedCardId}
                                        onToggleSelect={onToggleSelect}
                                        onEdit={(c) => setCardToEdit?.(c)}
                                        onDelete={(c, e) => { e.stopPropagation(); setCardToDelete(c); }}
                                    />
                                )}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
