import React, { useState, useMemo, useCallback } from 'react';
import type { Card } from '../types';
import SearchSynthesis from './SearchSynthesis';
import { useTheme } from '../context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useCardStore as useCards } from '../store/useCardStore';
import { useUIStore as useUI } from '../store/useUIStore';
import { BrowseToolbar, type SortOption } from './browse/BrowseToolbar';
import { BrowseMainContent } from './browse/BrowseMainContent';
import { calculateQualityScore } from '../algorithms/qualityScoring';

import { useNavigate } from 'react-router-dom';
import { CardSidePanel } from './CardSidePanel';
import { DetailModal } from './DetailModal';
import { BrowseSelectionBar } from './BrowseSelectionBar';
import { useFilteredCards } from '../hooks/useFilteredCards';

interface BrowsePageProps {
    // Optional: Render prop for Network View to reuse existing component
    renderNetworkView?: (activeNodeId: string | null) => React.ReactNode;
    isNetworkOnly?: boolean;

    // Network side panel: card shown alongside the network view when a node is clicked
    networkPanelCard?: Card | null;
    onNetworkPanelClose?: () => void;
    networkPanelPinned?: boolean;
    onNetworkPanelPinToggle?: () => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
    renderNetworkView,
    isNetworkOnly = false,
    networkPanelCard,
    onNetworkPanelClose,
    networkPanelPinned = false,
    onNetworkPanelPinToggle,
}) => {
    const { getCategoryColor, getCategoryIcon, darkMode } = useTheme();
    const { cards, setEditingCard, setCardToDelete } = useCards();
    const { searchQuery, activeFilters, setActiveFilters, viewMode, setViewMode, setAddDataMode } = useUI();
    const { filteredCards, isSearching } = useFilteredCards(cards, searchQuery, activeFilters);
    const navigate = useNavigate();

    const [sortOption, setSortOption] = useState<SortOption>('name-asc');

    const sortedCards = useMemo(() => {
        const sorted = [...filteredCards];
        switch (sortOption) {
            case 'name-asc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'name-desc':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            case 'type':
                return sorted.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
            case 'date-created-desc':
                return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            case 'date-created-asc':
                return sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            case 'date-modified-desc':
                return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            default:
                return sorted;
        }
    }, [filteredCards, sortOption]);

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [synthesisPanelCardId, setSynthesisPanelCardId] = useState<string | null>(null);

    // ── Multi-sélection ────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const isSelectionMode = selectedIds.size > 0;

    const toggleCardSelect = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(sortedCards.map(c => c.id)));
    }, [sortedCards]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const deleteSelected = useCallback(() => {
        selectedIds.forEach(id => {
            const card = cards.find(c => c.id === id);
            if (card) setCardToDelete(card);
        });
        clearSelection();
    }, [selectedIds, cards, setCardToDelete, clearSelection]);

    const selectedCard = useMemo(() => {
        if (!selectedCardId) return null;
        return cards.find(c => c.id === selectedCardId) || null;
    }, [cards, selectedCardId]);

    const selectedIndex = filteredCards.findIndex(c => c.id === selectedCardId);
    const handleNextCard = () => {
        if (selectedIndex >= 0 && selectedIndex < filteredCards.length - 1) {
            setSelectedCardId(filteredCards[selectedIndex + 1].id);
        }
    };
    const handlePrevCard = () => {
        if (selectedIndex > 0) {
            setSelectedCardId(filteredCards[selectedIndex - 1].id);
        }
    };
    const synthesisPanelCard = useMemo(() => {
        if (!synthesisPanelCardId) return null;
        return cards.find(c => c.id === synthesisPanelCardId) || null;
    }, [cards, synthesisPanelCardId]);
    

    const handleFilterToggle = (type: string) => {
        setActiveFilters(type === 'all' ? [] : 
            activeFilters.includes(type) ? activeFilters.filter(t => t !== type) : [...activeFilters, type]
        );
        setSelectedCardId(null);
    };

    const getFilterLabel = (type: string) => {
        switch (type) {
            case 'drug': return 'Médicaments';
            case 'patho': return 'Pathologies';
            case 'physio': return 'Physiologie';
            case 'data': return 'Données';
            case 'flashcard': return 'Flashcards';
            case 'concept': return 'Concepts';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    return (
        <div className="browse-container relative flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="w-full self-center flex flex-col flex-1 min-h-0 overflow-hidden">
            <BrowseToolbar
                cards={cards}
                activeFilters={activeFilters}
                handleFilterToggle={handleFilterToggle}
                getFilterLabel={getFilterLabel}
                onAdd={() => navigate('/add')}
                isNetworkOnly={isNetworkOnly}
                viewMode={viewMode}
                setViewMode={setViewMode}
                sortOption={sortOption}
                setSortOption={setSortOption}
            />
            <main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''} pt-5 pb-6 flex-1 flex flex-col min-h-0 overflow-hidden`}>

                {/* Search Synthesis */}
                {/* Search Synthesis */}
                <AnimatePresence>
                {searchQuery && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-[1600px] mx-auto self-center relative overflow-hidden px-10"
                    >
                        <SearchSynthesis
                            query={searchQuery}
                            matchedCards={sortedCards}
                            allCards={cards}
                            onCardClick={setSynthesisPanelCardId}
                        />
                        {isSearching && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white dark:bg-slate-900 py-1.5 px-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                                <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[0.8rem] text-slate-500 dark:text-slate-400">Recherche en cours...</span>
                            </div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>

                <div className={`w-full px-10 self-center max-w-[1600px] mx-auto flex flex-1 min-h-0 overflow-hidden ${(viewMode === 'split' && !isNetworkOnly) ? 'flex-row gap-0' : 'flex-col gap-8'}`}>
                    
                    {!isNetworkOnly && (
                        <BrowseMainContent
                            sortedCards={sortedCards}
                            viewMode={viewMode as 'grid'|'list'|'split'|'network'}
                            selectedCardId={selectedCardId}
                            selectedCard={selectedCard}
                            darkMode={darkMode}
                            getCategoryColor={getCategoryColor}
                            getCategoryIcon={getCategoryIcon}
                            calculateQualityScore={calculateQualityScore}
                            activeFilters={activeFilters}
                            isSelectionMode={isSelectionMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleCardSelect}
                            setSelectedCardId={setSelectedCardId}
                            setExpandedCardId={setExpandedCardId}
                            setCardToDelete={setCardToDelete}
                        />
                    )}

                    {(viewMode === 'split' || viewMode === 'network' || isNetworkOnly) && (
                        <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] relative flex flex-row h-full min-h-0 min-w-0 transition-all duration-300 shadow-sm mx-10">
                            <div className="flex-1 relative flex flex-col h-full min-h-0 min-w-0">
                                {renderNetworkView && renderNetworkView(selectedCardId)}
                            </div>
                            {/* Network side panel: shown when a node is clicked in the graph */}
                            {networkPanelCard && (
                                <div className="w-[450px] shrink-0 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                                    <CardSidePanel
                                        card={networkPanelCard}
                                        allCards={cards}
                                        onClose={onNetworkPanelClose ?? (() => {})}
                                        onPinToggle={onNetworkPanelPinToggle ?? (() => {})}
                                        pinned={networkPanelPinned}
                                        onLinkClick={(id) => setSelectedCardId(id)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </main>

            {selectedCard && (viewMode !== 'split' || expandedCardId === selectedCard.id) && (
                <DetailModal
                    key={`modal-${selectedCard.id}`}
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => {
                        setExpandedCardId(null);
                        if (viewMode !== 'split') {
                            setSelectedCardId(null);
                        }
                    }}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    onNext={handleNextCard}
                    onPrev={handlePrevCard}
                    onEdit={() => { setEditingCard(selectedCard); setAddDataMode('edit'); }}
                    onDelete={() => setCardToDelete(selectedCard)}
                />
            )}



        
            {synthesisPanelCard && expandedCardId !== synthesisPanelCard.id && (
                <div key={`synthesis-container-${synthesisPanelCard.id}`} className={`top-4 right-4 bottom-4 max-w-[100vw] bg-white dark:bg-slate-900 z-[1000] shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)] ${viewMode === 'split' ? 'absolute w-[calc(50%-32px)]' : 'fixed w-[500px]'} h-[calc(100%-32px)]`}>
                    <CardSidePanel
                        key={`synthesis-${synthesisPanelCard.id}`}
                        card={synthesisPanelCard}
                        allCards={cards}
                        onClose={() => setSynthesisPanelCardId(null)}
                        onPinToggle={() => {}}
                        pinned={false}
                        onExpand={() => setExpandedCardId(synthesisPanelCard.id)}
                        onLinkClick={(id) => {
                            setSynthesisPanelCardId(id);
                        }}
                    />
                </div>
            )}
            {/* Barre de multi-sélection flottante */}
            {isSelectionMode && (
                <BrowseSelectionBar
                    selectedIds={selectedIds}
                    allCards={cards}
                    onDeleteSelected={deleteSelected}
                    onSelectAll={selectAll}
                    onClear={clearSelection}
                />
            )}
            </div>
        </div>
    );
};
