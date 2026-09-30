import { doc, deleteDoc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { auth, db, prepareForFirebase } from '../lib/firebase';
import type { Card } from '../types';
import { syncQueue } from './syncQueue';
import { useCardStore } from '../store/useCardStore';

export const cardSyncService = {
  // Public methods just enqueue the tasks
  saveCard: (card: Card): void => {
    if (!auth.currentUser) return;
    syncQueue.enqueueSaveCard(card);
  },

  deleteCard: (cardId: string): void => {
    if (!auth.currentUser) return;
    syncQueue.enqueueDeleteCard(cardId);
  },

  // Internal methods used by SyncQueue to actually perform the operations
  performSaveCard: async (card: Card): Promise<void> => {
    if (!auth.currentUser) return; // Will be handled by the check in processQueue
    
    const cardRef = doc(db, `users/${auth.currentUser.uid}/cards`, card.id);
    const sanitized = prepareForFirebase(card);

    // Avertissement taille document (limite Firestore = 1 Mo)
    const sizeBytes = new Blob([JSON.stringify(sanitized)]).size;
    if (sizeBytes > 750_000) {
      console.warn("Card size is approaching Firestore limit (1MB):", sizeBytes);
    }

    // Check server version to prevent overwriting newer changes
    try {
      const snap = await getDoc(cardRef);
      if (snap.exists()) {
        const serverCard = snap.data() as Card;
        if ((serverCard.updatedAt || 0) > (sanitized.updatedAt || 0)) {
          console.warn("Server card is newer, skipping local overwrite.");
          return; // Server is newer, the sync listener will pull the new version
        }
      }
    } catch (error) {
      console.error("Error checking server card version:", error);
      throw error; // Rethrow so syncQueue will retry this item later if it's a network error
    }

    await setDoc(cardRef, sanitized);
  },

  performDeleteCard: async (cardId: string): Promise<void> => {
    if (!auth.currentUser) return;
    const cardRef = doc(db, `users/${auth.currentUser.uid}/cards`, cardId);
    await deleteDoc(cardRef);
  }
};
