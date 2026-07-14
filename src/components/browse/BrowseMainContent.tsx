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

// ── Grid list wrapper (unchanged) ──────────────────────────────────────────────
const CustomGridList = React.forwardRef((props: any, ref) => {
    const { context, style, children, ...rest } = props;
    const { viewMode, gridColumns } = context || {};
    return (
        <div className="flex justify-center w-full pb-8">
            <div
                {...rest}
                ref={ref}
                style={{ ...style, display: undefined, flexWrap: undefined }}
                className={`grid gap-5 px-10 py-4 w-full ${viewMode !== 'split' ? 'max-w-[1600px]' : ''} ${gridColumns}`}
            >
                {children}
            </div>
        </div>
    );
});

// ── List rows wrapper — simple div, header is rendered OUTSIDE ─────────────────
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

// ── Header columns (shared widths must match BrowseListItem layout) ────────────
const ListHeader: React.FC = () => (
    <div className="flex items-center gap-5 py-3 px-7 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] shrink-0 select-none">
        {/* checkbox spacer */}
        <div className="shrink-0 w-[18px]" />
        {/* icon spacer */}
        <div className="shrink-0 w-[38px]" />
        {/* title */}
        <div className="flex-1 text-[11px] font-bold text-[color:var(--color-text-muted)] tracking-[0.08em] uppercase">
            Titre de la fiche
        </div>
        {/* category */}
        <div className="hidden sm:block shrink-0 w-[110px] text-[11px] font-bold text-[color:var(--color-text-muted)] tracking-[0.08em] uppercase">
            Catégorie
        </div>
        {/* tags */}
        <div className="hidden lg:block shrink-0 w-[200px] text-[11px] font-bold text-[color:var(--color-text-muted)] tracking-[0.08em] uppercase">
            Tags
        </div>
        {/* actions spacer */}
        <div className="shrink-0 w-[68px]" />
    </div>
);

export const BrowseMainContent: React.FC<BrowseMainContentProps> = ({
    sortedCards, viewMode, selectedCardId, darkMode,
    getCategoryColor, getCategoryIcon, calculateQualityScore,
    activeFilters, isSelectionMode, selectedIds, onToggleSelect,
    setSelectedCardId, setExpandedCardId, setCardToDelete, setCardToEdit
}) => {
    const isGrid = viewMode === 'grid' || viewMode === 'split';

    const gridColumns = viewMode === 'split'
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    return (
        <div
            className={`browse-main-wrapper flex flex-col min-h-0 min-w-0 overflow-hidden ${viewMode === 'split' ? 'is-split' : ''}`}
            style={{ flex: viewMode === 'split' ? '0 0 55%' : 1 }}
        >
            {/* ── Grid / Split view ── */}
            {isGrid && (
                <div className="flex-1 min-h-0 flex flex-col">
                    {sortedCards.length === 0 ? (
                        <div className="text-center p-16 text-[color:var(--color-text-muted)]">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <VirtuosoGrid
                            className="browse-virtuoso-scroller flex-1"
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

            {/* ── List view — header fixed outside Virtuoso ── */}
            {viewMode === 'list' && (
                <div className="flex-1 min-h-0 flex flex-col px-10 pb-8">
                    {sortedCards.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[color:var(--color-text-muted)] text-[15px]">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col bg-[color:var(--color-surface)] rounded-[20px] border border-[color:var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
                            {/* Sticky header — stays fixed while rows scroll */}
                            <ListHeader />

                            {/* Scrollable rows via Virtuoso */}
                            <VirtuosoGrid
                                className="browse-virtuoso-scroller flex-1 min-h-0"
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
