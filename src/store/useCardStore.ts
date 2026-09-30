import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Card, CardHistory } from '../types';
import { saveCardsAsync } from '../storage';
import { recordPositiveFeedback, recordNegativeFeedback } from '../linkFeedback';
import { buildCardEmbeddings } from '../semanticSearch';
import { updateIndex, removeFromIndex } from '../searchIndex';
import { CardSchema } from '../schema';
import { auth, db } from '../lib/firebase';
import { useUIStore } from './useUIStore';
import { cardSyncService } from '../services/cardSyncService';
import { extractKeywordsAsync } from '../algorithms/keywordExtractor';

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
  deleteCards: (ids: string[]) => void;
  handleBatchImport: (newCards: Card[]) => Promise<void>;
  handleSuppressConnections: (pairs: { sourceId: string; targetId: string }[]) => void;
  setCardToDelete: (card: Card | null) => void;
  setEditingCard: (card: Card | null) => void;
  reloadFromStorage: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearStore: () => void;
  mergeRemoteCards: (remoteCards: Card[], deletedIds: string[]) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: true,
  cardToDelete: null,
  editingCard: null,

  clearStore: () => set({ cards: [], isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  setCards: (cardsOrUpdater, skipSave) => {
    set((state) => {
      const newCards = typeof cardsOrUpdater === 'function' ? cardsOrUpdater(state.cards) : cardsOrUpdater;
      if (!skipSave) {
        saveCardsAsync(newCards).catch(() => toast.error('Erreur lors de la sauvegarde locale.'));
      }
      return { cards: newCards };
    });
  },

  mergeRemoteCards: (remoteCards, deletedIds) => {
    set((state) => {
      const cardMap = new Map(state.cards.map(c => [c.id, c]));
      let hasChanges = false;
      
      // Handle deletions
      for (const id of deletedIds) {
        if (cardMap.has(id)) {
          cardMap.delete(id);
          removeFromIndex(id);
          hasChanges = true;
        }
      }

      // Handle additions/updates
      for (const remoteCard of remoteCards) {
        const localCard = cardMap.get(remoteCard.id);
        
        if (!localCard) {
          // New card from remote
          cardMap.set(remoteCard.id, remoteCard);
          updateIndex(remoteCard);
          hasChanges = true;
        } else if (remoteCard.updatedAt && localCard.updatedAt) {
          // Both have timestamps, compare
          if (remoteCard.updatedAt > localCard.updatedAt) {
            cardMap.set(remoteCard.id, remoteCard);
            updateIndex(remoteCard);
            hasChanges = true;
          }
        } else if (remoteCard.updatedAt && !localCard.updatedAt) {
           cardMap.set(remoteCard.id, remoteCard);
           updateIndex(remoteCard);
           hasChanges = true;
        }
      }

      if (hasChanges) {
        const newCards = Array.from(cardMap.values());
        saveCardsAsync(newCards).catch(console.error);
        return { cards: newCards };
      }
      
      return state;
    });
  },

  reloadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const { loadCardsAsync } = await import('../storage');
      const cards = await loadCardsAsync();
      
      // C-2 fix: Only seed if empty AND user has no Firebase data yet.
      // The seed flag is checked INSIDE loadCardsAsync via db_initialized.
      // If cards are empty here after loading, it means this is truly a fresh DB
      // (db_initialized would have seeded already, so we don't double-seed).
      set({ cards, isLoading: false });
    } catch (err) {
      console.error("Error reloading cards from storage:", err);
      set({ isLoading: false });
    }
  },

  loadDemoData: async () => {
    set({ isLoading: true });
    try {
      const { initialCards } = await import('../data');
      const { saveCardsAsync } = await import('../storage');
      await saveCardsAsync(initialCards);
      
      const newCards = [...initialCards];
      // Sync to Firebase if online
      if (auth.currentUser) {
        newCards.forEach(card => {
          cardSyncService.saveCard({
             ...card,
             ownerUid: auth.currentUser!.uid
          });
        });
      }
      set({ cards: newCards, isLoading: false });
      toast.success("Cours de démonstration chargé !");
    } catch (err) {
      console.error("Error loading demo data:", err);
      set({ isLoading: false });
      toast.error("Erreur lors du chargement des données.");
    }
  },

  handleSaveCard: (card: Card) => {
    const state = get();
    const newCards = [...state.cards];
    const existsIndex = newCards.findIndex(c => c.id === card.id);
    
    // Ownership check for existing cards
    if (existsIndex >= 0) {
      const oldCard = newCards[existsIndex];
      const currentUid = auth.currentUser?.uid || null;
      if (oldCard.ownerUid && currentUid && oldCard.ownerUid !== currentUid) {
        toast.error("Permission refusée: Vous n'êtes pas le propriétaire de cette fiche.");
        return;
      }
    }

    // Stamp ownerUid: current user uid, or null if offline (keep existing if already set, except we checked ownership above)
    // Actually, if offline, keep the previous ownerUid so we don't accidentally erase it.
    const stampedCard: Card = {
      ...card,
      ownerUid: auth.currentUser?.uid ?? (existsIndex >= 0 ? newCards[existsIndex].ownerUid : null),
    };

    // --- Robot Bibliothécaire : Extraction automatique des mots-clés ---
    if (!stampedCard.tags || stampedCard.tags.length === 0) {
      stampedCard.tags = [];
      extractKeywordsAsync(stampedCard.title, stampedCard.subtitle, stampedCard.content).then(generatedTags => {
        if (generatedTags.length > 0) {
          const currentCards = get().cards;
          const idx = currentCards.findIndex(c => c.id === stampedCard.id);
          if (idx >= 0) {
            const updatedCard = { ...currentCards[idx], tags: generatedTags };
            const updatedCards = [...currentCards];
            updatedCards[idx] = updatedCard;
            set({ cards: updatedCards });
            saveCardsAsync(updatedCards).catch(console.error);
            cardSyncService.saveCard(updatedCard);
            updateIndex(updatedCard);
          }
        }
      });
    }

    if (stampedCard.manualConnections && stampedCard.manualConnections.length > 0) {
      const oldCard = existsIndex >= 0 ? newCards[existsIndex] : null;
      const oldManual = new Set(oldCard?.manualConnections || []);
      const newConnections = stampedCard.manualConnections.filter(id => !oldManual.has(id));
      
      if (newConnections.length > 0) {
        const cardMap = new Map(newCards.map(c => [c.id, c]));
        newConnections.forEach(targetId => {
          const targetCard = cardMap.get(targetId);
          if (targetCard) {
            recordPositiveFeedback(stampedCard, targetCard);
          }
        });
      }
    }

    // Add history log
    const currentUserId = auth.currentUser?.uid || null;
    if (existsIndex >= 0) {
      const oldCard = newCards[existsIndex];
      const diff: NonNullable<CardHistory['diff']> = {};
      if (oldCard.title !== stampedCard.title) diff.title = { old: oldCard.title, new: stampedCard.title };
      if (oldCard.subtitle !== stampedCard.subtitle) diff.subtitle = { old: oldCard.subtitle, new: stampedCard.subtitle };
      if (oldCard.content !== stampedCard.content) diff.content = { old: oldCard.content, new: stampedCard.content };
      if (oldCard.details !== stampedCard.details) diff.details = { old: oldCard.details, new: stampedCard.details };
      if (JSON.stringify(oldCard.tags || []) !== JSON.stringify(stampedCard.tags || [])) diff.tags = { old: oldCard.tags || [], new: stampedCard.tags || [] };
      if (JSON.stringify(oldCard.manualConnections || []) !== JSON.stringify(stampedCard.manualConnections || [])) diff.manualConnections = { old: oldCard.manualConnections || [], new: stampedCard.manualConnections || [] };
      
      // Only log if something text-related changed
      if (Object.keys(diff).length > 0) {
        const historyEntry: CardHistory = {
          timestamp: Date.now(),
          userId: currentUserId,
          action: 'update',
          diff
        };
        stampedCard.history = [...(oldCard.history || []), historyEntry];
      } else {
        stampedCard.history = oldCard.history || [];
      }
      
      newCards[existsIndex] = stampedCard;
    } else {
      stampedCard.history = [{
        timestamp: Date.now(),
        userId: currentUserId,
        action: 'create'
      }];
      newCards.push(stampedCard);
    }

    set({ cards: newCards, editingCard: null });
    saveCardsAsync(newCards).catch(console.error);

    // Synchronisation Firebase
    cardSyncService.saveCard(stampedCard);

    updateIndex(stampedCard);
    buildCardEmbeddings([stampedCard], true);
  },

  handleDeleteCard: (card: Card) => {
    set({ cardToDelete: card });
  },

  confirmDelete: () => {
    const state = get();
    if (state.cardToDelete) {
      const cardId = state.cardToDelete.id;
      
      // Recurse to find all children (e.g., Course -> Concept -> Flashcard)
      const getAllChildIds = (parentId: string, allCards: Card[]): string[] => {
        const directChildren = allCards.filter(c => c.parentId === parentId).map(c => c.id);
        let allChildIds = [...directChildren];
        for (const childId of directChildren) {
          allChildIds = [...allChildIds, ...getAllChildIds(childId, allCards)];
        }
        return allChildIds;
      };
      
      const childIds = new Set(getAllChildIds(cardId, state.cards));
      
      const newCards = state.cards.filter(c => c.id !== cardId && !childIds.has(c.id));
      set({ cards: newCards, cardToDelete: null });
      saveCardsAsync(newCards).catch(console.error);

      // Synchronisation Firebase (cours + enfants)
      cardSyncService.deleteCard(cardId);
      childIds.forEach(childId => cardSyncService.deleteCard(childId));
      removeFromIndex(cardId);
      childIds.forEach(childId => removeFromIndex(childId));
    }
  },

  deleteCards: (ids: string[]) => {
    const state = get();
    const idSet = new Set(ids);
    const newCards = state.cards.filter(c => !idSet.has(c.id));
    set({ cards: newCards });
    saveCardsAsync(newCards).catch(console.error);

    ids.forEach(id => {
      cardSyncService.deleteCard(id);
      removeFromIndex(id);
    });
  },

  handleBatchImport: async (newCards: Card[]) => {
    const validCards: Card[] = [];
    newCards.forEach(card => {
      const result = CardSchema.safeParse(card);
      if (result.success) {
        validCards.push(result.data as Card);
      } else {
        console.error("Invalid card during batch import:", result.error);
      }
    });

    const state = get();
    const merged = [...state.cards];
    validCards.forEach(nc => {
      const index = merged.findIndex(c => c.id === nc.id);
      if (index >= 0) {
        merged[index] = nc;
      } else {
        merged.push(nc);
      }
    });

    set({ cards: merged });
    saveCardsAsync(merged).catch(console.error);

    // M-3 fix: sync batch-imported cards to Firebase when user is connected
    if (auth.currentUser) {
      useUIStore.getState().setSyncStatus('pending');
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      validCards.forEach(card => {
        const stamped = { ...card, ownerUid: auth.currentUser!.uid };
        const ref = doc(db, `users/${auth.currentUser!.uid}/cards`, stamped.id);
        batch.set(ref, stamped);
      });
      batch.commit()
        .then(() => useUIStore.getState().setSyncStatus('synced'))
        .catch(err => {
          console.error("Batch sync to Firebase failed:", err);
          useUIStore.getState().setSyncStatus('error');
        });
    }

    validCards.forEach(card => updateIndex(card));
    buildCardEmbeddings(validCards, true);
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
