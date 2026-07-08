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
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingBottom: '2rem' }}>
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
            style={{ display: 'flex', flexDirection: 'column', minWidth: 0, ...style }}
        >
            {children}
        </div>
    );
});

// ── Header columns (shared widths must match BrowseListItem layout) ────────────
const ListHeader: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '12px 28px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
        userSelect: 'none',
    }}>
        {/* checkbox spacer */}
        <div style={{ flexShrink: 0, width: '18px' }} />
        {/* icon spacer */}
        <div style={{ flexShrink: 0, width: '38px' }} />
        {/* title */}
        <div style={{
            flex: 1,
            fontSize: '11px', fontWeight: 700,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
            Titre de la fiche
        </div>
        {/* category */}
        <div
            className="hidden sm:block"
            style={{
                flexShrink: 0, width: '110px',
                fontSize: '11px', fontWeight: 700,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
        >
            Catégorie
        </div>
        {/* tags */}
        <div
            className="hidden lg:block"
            style={{
                flexShrink: 0, width: '200px',
                fontSize: '11px', fontWeight: 700,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
        >
            Tags
        </div>
        {/* actions spacer */}
        <div style={{ flexShrink: 0, width: '68px' }} />
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
            className={`browse-main-wrapper ${viewMode === 'split' ? 'is-split' : ''}`}
            style={{
                flex: viewMode === 'split' ? '0 0 55%' : 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
            }}
        >
            {/* ── Grid / Split view ── */}
            {isGrid && (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    {sortedCards.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <VirtuosoGrid
                            className="browse-virtuoso-scroller"
                            style={{ flex: 1 }}
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
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 40px 32px',
                }}>
                    {sortedCards.length === 0 ? (
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-muted)', fontSize: '15px',
                        }}>
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <div style={{
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--color-surface)',
                            borderRadius: '20px',
                            border: '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow)',
                            overflow: 'hidden',
                        }}>
                            {/* Sticky header — stays fixed while rows scroll */}
                            <ListHeader />

                            {/* Scrollable rows via Virtuoso */}
                            <VirtuosoGrid
                                className="browse-virtuoso-scroller"
                                style={{ flex: 1, minHeight: 0 }}
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
