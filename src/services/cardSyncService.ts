import { doc, deleteDoc, runTransaction } from 'firebase/firestore';
import { auth, db, sanitizeForFirebase } from '../lib/firebase';
import type { Card } from '../types';
import { syncQueue } from './syncQueue';

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
    if (!auth.currentUser) return;
    
    const cardRef = doc(db, `users/${auth.currentUser.uid}/cards`, card.id);
    const sanitized = sanitizeForFirebase(card);

    // Avertissement taille document (limite Firestore = 1 Mo)
    const sizeBytes = new Blob([JSON.stringify(sanitized)]).size;
    if (sizeBytes > 750_000) {
      console.warn(`[Sync] Fiche "${card.title}" est volumineuse (${Math.round(sizeBytes / 1024)} Ko). ` +
        `Risque de dépassement limite Firestore (1 Mo). Envisager de migrer le contenu vers Storage.`);
    }

    // Use transaction to ensure we don't overwrite a newer server version
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(cardRef);
      if (docSnap.exists()) {
        const serverData = docSnap.data();
        if (serverData.updatedAt && card.updatedAt && serverData.updatedAt > card.updatedAt) {
          // Server has a more recent version, we reject this local save
          throw new Error("CONFLICT_SERVER_NEWER");
        }
      }
      transaction.set(cardRef, sanitized);
    });
  },

  performDeleteCard: async (cardId: string): Promise<void> => {
    if (!auth.currentUser) return;
    const cardRef = doc(db, `users/${auth.currentUser.uid}/cards`, cardId);
    await deleteDoc(cardRef);
  }
};
