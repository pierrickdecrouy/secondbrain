import React from 'react';
import type { Card } from '../types';
import { DetailModal } from './DetailModal';
import { AddDataModal } from './AddDataModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ReviewSessionModal } from './ReviewSessionModal';
import { PomodoroModal } from './PomodoroModal';
import { GlobalOmnibox } from './GlobalOmnibox';
import { GlobalPromptModal } from './GlobalPromptModal';
import { OfflineMigrationModal } from './OfflineMigrationModal';

interface AppModalsProps {
    selectedCard: Card | null;
    isNetworkContext: boolean;
    cards: Card[];
    setSelectedCardId: (id: string | null) => void;
    handleEditCard: (card: Card) => void;
    handleDeleteCard: (card: Card) => void;
    filteredCards: Card[];
    selectedCardId: string | null;
    addDataMode: string;
    editingCard: Card | null;
    handleSaveCardWrapped: (card: Card) => void;
    handleBatchImportWrapped: (cards: Card[]) => void;
    setAddDataMode: (mode: any) => void;
    setEditingCard: (card: Card | null) => void;
    cardToDelete: Card | null;
    confirmDeleteWrapped: () => void;
    setCardToDelete: (card: Card | null) => void;
    reviewSession: any;
    reviewSessionCards: Card[];
    setReviewSession: (session: any) => void;
    handleRateCard: (cardId: string, rating: 1 | 2 | 3 | 4) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
    selectedCard,
    isNetworkContext,
    cards,
    setSelectedCardId,
    handleEditCard,
    handleDeleteCard,
    filteredCards,
    selectedCardId,
    addDataMode,
    editingCard,
    handleSaveCardWrapped,
    handleBatchImportWrapped,
    setAddDataMode,
    setEditingCard,
    cardToDelete,
    confirmDeleteWrapped,
    setCardToDelete,
    reviewSession,
    reviewSessionCards,
    setReviewSession,
    handleRateCard
}) => {
    return (
        <>
            {selectedCard && !isNetworkContext && (
                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    onEdit={() => handleEditCard(selectedCard)}
                    onDelete={() => handleDeleteCard(selectedCard)}
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
