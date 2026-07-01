import { useEffect } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    getDocs,
    writeBatch,
} from 'firebase/firestore';
import { db, sanitizeForFirebase } from '../lib/firebase';
import { useCardStore } from '../store/useCardStore';
import { useAuth } from '../context/AuthContext';
import type { Card } from '../types';

import { toast } from '../store/useToastStore';
import { useUIStore } from '../store/useUIStore';

// Simple toast tracking shown only once per session
let migrationToastShown = false;
let lastMigrationUid: string | null = null;

export const useFirebaseSync = () => {
    const { user, loading } = useAuth();
    const { setCards } = useCardStore();

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        const userCardsRef = collection(db, `users/${user.uid}/cards`);

        const syncInitial = async () => {
            useUIStore.getState().setSyncStatus('pending');
            try {
                const snapshot = await getDocs(userCardsRef);
                const remoteCards: Record<string, Card> = {};
                snapshot.forEach(d => { remoteCards[d.id] = d.data() as Card; });

                const localCards = useCardStore.getState().cards;
                const mergedCards = [...localCards];
                let hasLocalChanges = false;
                const batch = writeBatch(db);
                let batchCount = 0;

                // ── Migrate offline cards (ownerUid === null) ──────────────
                // A-4 fix: reset migrationToastShown when user changes
                if (lastMigrationUid !== user.uid) {
                    migrationToastShown = false;
                    lastMigrationUid = user.uid;
                }
                let migratedCount = 0;
                for (const localCard of localCards) {
                    if (localCard.ownerUid === null || localCard.ownerUid === undefined) {
                        // Adopt this card: stamp the user's uid
                        const adopted: Card = { ...localCard, ownerUid: user.uid };
                        const idx = mergedCards.findIndex(c => c.id === adopted.id);
                        if (idx >= 0) mergedCards[idx] = adopted;
                        const cardRef = doc(db, `users/${user.uid}/cards`, adopted.id);
                        batch.set(cardRef, sanitizeForFirebase(adopted));
                        batchCount++;
                        migratedCount++;
                        hasLocalChanges = true;
                    }
                }

                // ── Push local cards newer than remote ────────────────────
                for (const localCard of localCards) {
                    if (localCard.ownerUid === null || localCard.ownerUid === undefined) continue; // already handled above
                    if (!remoteCards[localCard.id]) {
                        const cardRef = doc(db, `users/${user.uid}/cards`, localCard.id);
                        batch.set(cardRef, sanitizeForFirebase(localCard));
                        batchCount++;
                    } else if ((localCard.updatedAt || 0) > (remoteCards[localCard.id].updatedAt || 0)) {
                        const cardRef = doc(db, `users/${user.uid}/cards`, localCard.id);
                        batch.set(cardRef, sanitizeForFirebase(localCard));
                        batchCount++;
                    }
                }

                if (batchCount > 0) await batch.commit();
                if (migratedCount > 0 && !migrationToastShown) {
                    migrationToastShown = true;
                    toast.success(`✓ ${migratedCount} fiche${migratedCount > 1 ? 's' : ''} hors-ligne migrée${migratedCount > 1 ? 's' : ''} vers votre compte.`);
                }

                // ── Pull remote cards into local ──────────────────────────
                for (const [id, remoteCard] of Object.entries(remoteCards)) {
                    const localIndex = mergedCards.findIndex(c => c.id === id);
                    if (localIndex === -1) {
                        mergedCards.push(remoteCard);
                        hasLocalChanges = true;
                    } else if ((remoteCard.updatedAt || 0) > (mergedCards[localIndex].updatedAt || 0)) {
                        mergedCards[localIndex] = remoteCard;
                        hasLocalChanges = true;
                    }
                }

                if (hasLocalChanges) {
                    setCards(mergedCards, false);
                }
                useUIStore.getState().setSyncStatus('synced');
            } catch (error) {
                console.error('Erreur lors de la synchro initiale Firebase:', error);
                useUIStore.getState().setSyncStatus('error');
                toast.error('Erreur de synchronisation Firebase', 0, {
                    label: 'Réessayer',
                    onClick: () => {
                        syncInitial();
                    }
                });
            }
        };

        let unsubscribe: (() => void) | undefined;

        const initAndListen = async () => {
            await syncInitial();

            // ── Real-time listener ────────────────────────────────────────────
            unsubscribe = onSnapshot(userCardsRef, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = change.doc.data() as Card;
                    const currentCards = useCardStore.getState().cards;

                    if (change.type === 'added' || change.type === 'modified') {
                        const existsIndex = currentCards.findIndex(c => c.id === data.id);
                        if (existsIndex >= 0) {
                            if ((data.updatedAt || 0) > (currentCards[existsIndex].updatedAt || 0)) {
                                const newCards = [...currentCards];
                                newCards[existsIndex] = data;
                                // C-3 fix: skipSave=true — Firebase is the source of truth here,
                                // saving back to IndexedDB would cause a write→snapshot→write loop.
                                setCards(newCards, true);
                            }
                        } else {
                            setCards([...currentCards, data], true); // C-3 fix: skipSave=true
                        }
                    }
                    if (change.type === 'removed') {
                        setCards(currentCards.filter(c => c.id !== data.id), true); // C-3 fix: skipSave=true
                    }
                });
            });
        };

        initAndListen();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, loading, setCards]);
};
