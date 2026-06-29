import { useEffect } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    getDocs,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCardStore } from '../store/useCardStore';
import { useAuth } from '../context/AuthContext';
import type { Card } from '../types';

// Simple toast shown only once per session
let migrationToastShown = false;

const showMigrationToast = (count: number) => {
    if (migrationToastShown || count === 0) return;
    migrationToastShown = true;
    // Use a DOM toast since we don't have a toast store yet
    const el = document.createElement('div');
    el.textContent = `✓ ${count} fiche${count > 1 ? 's' : ''} hors-ligne migrée${count > 1 ? 's' : ''} vers votre compte.`;
    Object.assign(el.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#10b981',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
        transition: 'opacity 0.4s',
        fontFamily: 'Inter, system-ui, sans-serif',
    });
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
    }, 4000);
};

export const useFirebaseSync = () => {
    const { user, loading } = useAuth();
    const { setCards } = useCardStore();

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        const userCardsRef = collection(db, `users/${user.uid}/cards`);

        const syncInitial = async () => {
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
                let migratedCount = 0;
                for (const localCard of localCards) {
                    if (localCard.ownerUid === null || localCard.ownerUid === undefined) {
                        // Adopt this card: stamp the user's uid
                        const adopted: Card = { ...localCard, ownerUid: user.uid };
                        const idx = mergedCards.findIndex(c => c.id === adopted.id);
                        if (idx >= 0) mergedCards[idx] = adopted;
                        const cardRef = doc(db, `users/${user.uid}/cards`, adopted.id);
                        batch.set(cardRef, adopted);
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
                        batch.set(cardRef, localCard);
                        batchCount++;
                    } else if ((localCard.updatedAt || 0) > (remoteCards[localCard.id].updatedAt || 0)) {
                        const cardRef = doc(db, `users/${user.uid}/cards`, localCard.id);
                        batch.set(cardRef, localCard);
                        batchCount++;
                    }
                }

                if (batchCount > 0) await batch.commit();
                if (migratedCount > 0) showMigrationToast(migratedCount);

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
            } catch (error) {
                console.error('Erreur lors de la synchro initiale Firebase:', error);
            }
        };

        syncInitial();

        // ── Real-time listener ────────────────────────────────────────────
        const unsubscribe = onSnapshot(userCardsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data() as Card;
                const currentCards = useCardStore.getState().cards;

                if (change.type === 'added' || change.type === 'modified') {
                    const existsIndex = currentCards.findIndex(c => c.id === data.id);
                    if (existsIndex >= 0) {
                        if ((data.updatedAt || 0) > (currentCards[existsIndex].updatedAt || 0)) {
                            const newCards = [...currentCards];
                            newCards[existsIndex] = data;
                            setCards(newCards, false);
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

        return () => unsubscribe();
    }, [user, loading, setCards]);
};
