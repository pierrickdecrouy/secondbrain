import { create } from 'zustand';
import type { Card } from '../types';
import { saveCardsAsync } from '../storage';
import { recordPositiveFeedback, recordNegativeFeedback } from '../linkFeedback';
import { buildCardEmbeddings } from '../semanticSearch';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  cardToDelete: Card | null;
  editingCard: Card | null;
  
  // Actions
  setIsLoading: (loading: boolean) => void;
  setCards: (cards: Card[] | ((prev: Card[]) => Card[]), skipSave?: boolean) => void;
  handleSaveCard: (card: Card) => void;
  handleDeleteCard: (card: Card) => void;
  confirmDelete: () => void;
  handleBatchImport: (newCards: Card[]) => Promise<void>;
  handleSuppressConnections: (pairs: { sourceId: string; targetId: string }[]) => void;
  setCardToDelete: (card: Card | null) => void;
  setEditingCard: (card: Card | null) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: true,
  cardToDelete: null,
  editingCard: null,

  setIsLoading: (loading) => set({ isLoading: loading }),

  setCards: (cardsOrUpdater, skipSave) => {
    set((state) => {
      const newCards = typeof cardsOrUpdater === 'function' ? cardsOrUpdater(state.cards) : cardsOrUpdater;
      if (!skipSave) {
        saveCardsAsync(newCards).catch(err => console.error("Auto-save failed:", err));
      }
      return { cards: newCards };
    });
  },

  handleSaveCard: (card: Card) => {
    const state = get();
    let newCards = [...state.cards];
    const existsIndex = newCards.findIndex(c => c.id === card.id);

    if (card.manualConnections && card.manualConnections.length > 0) {
      const oldCard = existsIndex >= 0 ? newCards[existsIndex] : null;
      const oldManual = new Set(oldCard?.manualConnections || []);
      card.manualConnections.forEach(targetId => {
        if (!oldManual.has(targetId)) {
          const targetCard = newCards.find(c => c.id === targetId);
          if (targetCard) {
            recordPositiveFeedback(card, targetCard);
          }
        }
      });
    }

    if (existsIndex >= 0) {
      newCards[existsIndex] = card;
    } else {
      newCards.push(card);
    }

    set({ cards: newCards, editingCard: null });
    saveCardsAsync(newCards).catch(console.error);

    buildCardEmbeddings([card], true);
  },

  handleDeleteCard: (card: Card) => {
    set({ cardToDelete: card });
  },

  confirmDelete: () => {
    const state = get();
    if (state.cardToDelete) {
      const newCards = state.cards.filter(c => c.id !== state.cardToDelete!.id);
      set({ cards: newCards, cardToDelete: null });
      saveCardsAsync(newCards).catch(console.error);
    }
  },

  handleBatchImport: async (newCards: Card[]) => {
    const state = get();
    const merged = [...state.cards];
    newCards.forEach(nc => {
      const index = merged.findIndex(c => c.id === nc.id);
      if (index >= 0) {
        merged[index] = nc;
      } else {
        merged.push(nc);
      }
    });

    set({ cards: merged });
    saveCardsAsync(merged).catch(console.error);

    // Call electron API if available
    // @ts-ignore
    if (window.electronAPI?.importCards) {
      // @ts-ignore
      const result = await window.electronAPI.importCards(newCards);
      if (!result.success) {
        // Show toast should be done via toast store
        console.error("Erreur lors de la sauvegarde: " + result.error);
      }
    }

    buildCardEmbeddings(newCards, true);
  },

  handleSuppressConnections: (pairs: { sourceId: string; targetId: string }[]) => {
    const state = get();
    const cardMap = new Map(state.cards.map(c => [c.id, c]));
    let hasChanges = false;

    pairs.forEach(({ sourceId, targetId }) => {
      const source = cardMap.get(sourceId);
      const target = cardMap.get(targetId);
      if (!source) return;

      const currentSuppressed = source.suppressedConnections || [];
      if (!currentSuppressed.includes(targetId)) {
        cardMap.set(sourceId, {
          ...source,
          suppressedConnections: [...currentSuppressed, targetId],
          updatedAt: Date.now()
        });
        hasChanges = true;

        if (target) {
          recordNegativeFeedback(source, target);
        }
      }
    });

    if (hasChanges) {
      const newCards = Array.from(cardMap.values());
      set({ cards: newCards });
      saveCardsAsync(newCards).catch(console.error);
    }
  },

  setCardToDelete: (card: Card | null) => set({ cardToDelete: card }),
  setEditingCard: (card: Card | null) => set({ editingCard: card })
}));
