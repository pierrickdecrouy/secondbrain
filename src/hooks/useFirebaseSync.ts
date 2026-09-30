import { useEffect } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    getDocs,
    writeBatch,
} from 'firebase/firestore';
import { db, prepareForFirebase } from '../lib/firebase';
import { useCardStore } from '../store/useCardStore';
import { useAuth } from '../context/AuthContext';
import { getOfflineCards } from '../storage';
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
            useUIStore.getState().setLastSyncError(null);
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
                
                const offlineCards = await getOfflineCards();
                let migratedCount = 0;
                
                if (offlineCards.length > 0 && !sessionStorage.getItem('extnd_ignore_offline')) {
                    useUIStore.getState().setPendingOfflineCards(offlineCards);
                }

                // ── Push local cards newer than remote ────────────────────
                for (const localCard of localCards) {
                    if (localCard.ownerUid === null || localCard.ownerUid === undefined) continue; // already handled above
                    if (!remoteCards[localCard.id]) {
                        const cardRef = doc(db, `users/${user.uid}/cards`, localCard.id);
                        batch.set(cardRef, prepareForFirebase(localCard));
                        batchCount++;
                    } else if ((localCard.updatedAt || 0) > (remoteCards[localCard.id].updatedAt || 0)) {
                        const cardRef = doc(db, `users/${user.uid}/cards`, localCard.id);
                        batch.set(cardRef, prepareForFirebase(localCard));
                        batchCount++;
                    }
                }

                if (batchCount > 0) await batch.commit();
                if (migratedCount > 0 && !migrationToastShown) {
                    migrationToastShown = true;
                    toast.success(`✓ ${migratedCount} fiche${migratedCount > 1 ? 's' : ''} hors-ligne migrée${migratedCount > 1 ? 's' : ''} vers votre compte.`);
                }

                let conflictsCount = 0;

                // ── Pull remote cards into local ──────────────────────────
                for (const [id, remoteCard] of Object.entries(remoteCards)) {
                    const localIndex = mergedCards.findIndex(c => c.id === id);
                    if (localIndex === -1) {
                        mergedCards.push(remoteCard);
                        hasLocalChanges = true;
                    } else if ((remoteCard.updatedAt || 0) > (mergedCards[localIndex].updatedAt || 0)) {
                        mergedCards[localIndex] = remoteCard;
                        hasLocalChanges = true;
                        conflictsCount++;
                    }
                }

                if (conflictsCount > 0) {
                    toast.info(`Une version plus récente a été restaurée depuis le serveur (${conflictsCount} fiche${conflictsCount > 1 ? 's' : ''}).`);
                }

                if (hasLocalChanges) {
                    setCards(mergedCards, false);
                }
                useUIStore.getState().setSyncStatus('synced');
                useUIStore.getState().setLastSyncAt(Date.now());
                useUIStore.getState().setLastSyncError(null);
            } catch (error) {
                console.error("🔥 Firebase Sync Error:", error);
                useUIStore.getState().setSyncStatus('error');
                useUIStore.getState().setLastSyncError((error as Error)?.message || 'Erreur de synchronisation Firebase');
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
                                // C-3 fix: skipSave=false — Firebase changes MUST be saved locally
                                // to persist when offline.
                                setCards(newCards, false);
                                toast.info('Une version plus récente a été restaurée depuis le serveur.');
                            }
                        } else {
                            setCards([...currentCards, data], false);
                        }
                    }
                    if (change.type === 'removed') {
                        setCards(currentCards.filter(c => c.id !== data.id), false);
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
