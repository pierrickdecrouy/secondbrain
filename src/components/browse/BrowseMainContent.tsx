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
}

const CustomGridList = React.forwardRef((props: any, ref) => {
    const { context, style, children, ...rest } = props;
    const { viewMode, gridColumns } = context || {};
    // We remove the default style from VirtuosoGrid which forces display:flex
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

const CustomListList = React.forwardRef((props: any, ref) => {
    const { style, children, ...rest } = props;
    return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingBottom: '2rem', ...style }}>
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                    {/* List Container for Virtuoso */}
                    <div className="overflow-x-auto w-full">
                        <div className="min-w-[900px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="col-span-1 pl-1"></div>
                                <div className="col-span-5">Titre</div>
                                <div className="col-span-2">Catégorie</div>
                                <div className="col-span-3">Tags</div>
                                <div className="col-span-1 text-right pr-1">Actions</div>
                            </div>
                            <div {...rest} ref={ref} className="flex flex-col w-full">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const BrowseMainContent: React.FC<BrowseMainContentProps> = ({
    sortedCards, viewMode, selectedCardId, darkMode,
    getCategoryColor, getCategoryIcon, calculateQualityScore,
    activeFilters, isSelectionMode, selectedIds, onToggleSelect,
    setSelectedCardId, setExpandedCardId, setCardToDelete
}) => {
    const isGrid = viewMode === 'grid' || viewMode === 'split';
    
    // Pour une grille fluide avec Tailwind :
    const gridColumns = viewMode === 'split' 
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" 
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

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
            {/* Mode grille / mixte */}
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
                                    onSelect={(id) => {
                                        setSelectedCardId(id);
                                    }}
                                    onToggleSelect={onToggleSelect}
                                    onDelete={(_, e) => { e.stopPropagation(); setCardToDelete(card); }}
                                />
                            )}
                        />
                    )}
                </div>
            )}

            {viewMode === 'list' && (
                <div style={{ flex: 1, minHeight: 0 }} className="w-full">
                    <VirtuosoGrid
                        className="px-4 browse-virtuoso-scroller"
                        style={{ height: '100%', width: '100%' }}
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
                            />
                        )}
                    />
                </div>
            )}
        </div>
    );
};
