import React, { useMemo, useCallback } from 'react';
import { DetailModal } from './DetailModal';
import { AddDataModal } from './AddDataModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ReviewSessionModal } from './ReviewSessionModal';
import { PomodoroModal } from './PomodoroModal';
import { GlobalOmnibox } from './GlobalOmnibox';
import { GlobalPromptModal } from './GlobalPromptModal';
import { OfflineMigrationModal } from './OfflineMigrationModal';

import { useCardStore } from '../store/useCardStore';
import { useUIStore } from '../store/useUIStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useReviewStore } from '../store/useReviewStore';
import { useFilteredCards } from '../hooks/useFilteredCards';
import { calculateFsrsProgress } from '../algorithms/fsrs';
import { useCurrentSection } from '../hooks/useCurrentSection';
import type { Card } from '../types';

export const AppModals: React.FC = () => {
    const { 
        cards, 
        editingCard, 
        setEditingCard, 
        handleSaveCard, 
        handleBatchImport,
        cardToDelete,
        setCardToDelete,
        confirmDelete
    } = useCardStore();
    
    const { 
        addDataMode, 
        setAddDataMode,
        searchQuery,
        activeFilters,
        viewMode
    } = useUIStore();
    
    const { 
        selectedCardId, 
        setSelectedCardId,
        networkPanelPinned,
        pinnedCardId
    } = useNavigationStore();
    
    const { reviewSession, setReviewSession } = useReviewStore();
    const activeSection = useCurrentSection();

    const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);

    const isNetworkContext = activeSection === "network" || (activeSection === "cards" && (viewMode === "network" || viewMode === "split"));

    const selectedCard = useMemo(() => {
        const panelCardId = networkPanelPinned && pinnedCardId ? pinnedCardId : selectedCardId;
        if (!panelCardId) return null;
        return cards.find((c) => c.id === panelCardId) ?? null;
    }, [cards, selectedCardId, networkPanelPinned, pinnedCardId]);

    const reviewSessionCards = useMemo(() => {
        if (!reviewSession) return [];
        const idSet = new Set(reviewSession.cardIds);
        return cards.filter(card => idSet.has(card.id));
    }, [cards, reviewSession]);

    const handleEditCard = useCallback((card: Card) => {
        setEditingCard(card);
        setAddDataMode("edit");
        setSelectedCardId(null);
    }, [setEditingCard, setAddDataMode, setSelectedCardId]);

    const handleSaveCardWrapped = useCallback((card: Card) => {
        handleSaveCard(card);
        setAddDataMode("none");
        setEditingCard(null);
    }, [handleSaveCard, setAddDataMode, setEditingCard]);

    const handleBatchImportWrapped = useCallback(async (newCards: Card[]) => {
        await handleBatchImport(newCards);
    }, [handleBatchImport]);

    const confirmDeleteWrapped = useCallback(() => {
        if (cardToDelete) {
            if (selectedCardId === cardToDelete.id) {
                setSelectedCardId(null);
            }
            confirmDelete();
        }
    }, [cardToDelete, selectedCardId, confirmDelete, setSelectedCardId]);

    const handleRateCard = useCallback((cardId: string, rating: 1 | 2 | 3 | 4) => {
        const card = cards.find((c) => c.id === cardId);
        if (!card) return;
        const isCourseType = card.nodeType === 'course' || card.nodeType === 'concept';
        const nextProgress = calculateFsrsProgress(card.progress, rating, isCourseType);
        handleSaveCard({
            ...card,
            progress: nextProgress,
            updatedAt: Date.now(),
        });
    }, [cards, handleSaveCard]);

    return (
        <>
            {selectedCard && !isNetworkContext && (
                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    onEdit={() => handleEditCard(selectedCard)}
                    onDelete={() => setCardToDelete(selectedCard)}
                    onNext={() => {
                        const idx = filteredCards.findIndex((c) => c.id === selectedCardId);
                        if (idx >= 0 && idx < filteredCards.length - 1) {
                            setSelectedCardId(filteredCards[idx + 1].id);
                        }
                    }}
                    onPrev={() => {
                        const idx = filteredCards.findIndex((c) => c.id === selectedCardId);
                        if (idx > 0) {
                            setSelectedCardId(filteredCards[idx - 1].id);
                        }
                    }}
                />
            )}

            {addDataMode === "edit" && (
                <AddDataModal
                    mode="edit"
                    card={editingCard}
                    existingCards={cards}
                    onSave={handleSaveCardWrapped}
                    onImport={handleBatchImportWrapped}
                    onClose={() => {
                        setAddDataMode("none");
                        setEditingCard(null);
                    }}
                />
            )}

            {cardToDelete && (
                <ConfirmDeleteModal
                    title={cardToDelete.title}
                    onConfirm={confirmDeleteWrapped}
                    onCancel={() => setCardToDelete(null)}
                />
            )}

            {reviewSession && reviewSessionCards.length > 0 && (
                <ReviewSessionModal
                    cards={reviewSessionCards}
                    allCards={cards}
                    title={reviewSession.title}
                    initialIndex={reviewSession.initialIndex}
                    onClose={() => setReviewSession(null)}
                    onRate={handleRateCard}
                    onJumpToCard={(id) => setSelectedCardId(id)}
                />
            )}

            <PomodoroModal />
            <GlobalOmnibox />
            <GlobalPromptModal />
            <OfflineMigrationModal />
        </>
    );
};
