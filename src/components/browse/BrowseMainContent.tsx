import React from 'react';
import { VirtuosoGrid, TableVirtuoso } from 'react-virtuoso';
import type { Card } from '../../types';
import type { QualityAssessment } from '../../algorithms/qualityScoring';
import { BrowseGridItem } from '../BrowseGridItem';
import { BrowseListItem } from '../BrowseListItem';

import type { AddDataMode } from '../../store/useUIStore';

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
    setEditingCard: (card: Card | null) => void;
    setAddDataMode: (mode: AddDataMode) => void;
    setCardToDelete: (card: Card | null) => void;
}

export const BrowseMainContent: React.FC<BrowseMainContentProps> = ({
    sortedCards, viewMode, selectedCardId, selectedCard,
    darkMode, getCategoryColor, getCategoryIcon, calculateQualityScore,
    activeFilters,
    isSelectionMode, selectedIds, onToggleSelect,
    setSelectedCardId, setExpandedCardId,
    setEditingCard, setAddDataMode, setCardToDelete
}) => {
    const isGrid = viewMode === 'grid' || viewMode === 'split';

    const gridColumns = viewMode === 'split'
        ? 'grid-cols-1 xl:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4';

    return (
        <div
            style={{
                flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1',
                transition: 'all 0.3s ease-in-out',
                paddingRight: viewMode === 'split' ? '1rem' : 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
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
                            listClassName={`grid gap-4 px-4 py-4 ${gridColumns}`}
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
                                    onSelect={setSelectedCardId}
                                    onToggleSelect={onToggleSelect}
                                    onDelete={(_, e) => { e.stopPropagation(); setCardToDelete(card); }}
                                />
                            )}
                        />
                    )}
                </div>
            )}

            {/* Mode liste */}
            {viewMode === 'list' && (
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: darkMode ? '#0c1322' : '#ffffff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
                    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 2px 12px rgba(0, 0, 0, 0.04)',
                    margin: '0 4px',
                }}>
                    <TableVirtuoso
                        style={{ height: '100%', width: '100%' }}
                        data={sortedCards}
                        fixedHeaderContent={() => (
                            <tr style={{ backgroundColor: darkMode ? '#0c1322' : '#f8fafc' }}>
                                {isSelectionMode && (
                                    <th style={{ padding: '12px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, width: '36px' }} />
                                )}
                                <th style={{ padding: '10px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: '96px' }}>Type</th>
                                <th style={{ padding: '10px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: '220px' }}>Titre</th>
                                <th style={{ padding: '10px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Extrait</th>
                                <th style={{ padding: '10px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: '120px' }}>Tags</th>
                                {!isSelectionMode && (
                                    <th style={{ padding: '10px 20px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: '80px', textAlign: 'right' }}>Actions</th>
                                )}
                            </tr>
                        )}
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
                                onEdit={(_, e) => { e.stopPropagation(); setEditingCard(card); setAddDataMode('edit'); }}
                                onDelete={(_, e) => { e.stopPropagation(); setCardToDelete(card); }}
                            />
                        )}
                    />
                </div>
            )}
        </div>
    );
};
