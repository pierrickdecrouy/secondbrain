import { useState, useEffect, useRef } from 'react';
import { useCardStore } from '../store/useCardStore';
import { loadCardsAsync, saveCardsAsync } from '../storage';
import { initialCards } from '../data';
import { initSemanticSearch, buildCardEmbeddings } from '../semanticSearch';
import { loadFeedback } from '../linkFeedback';
import { loadSettingAsync, saveSettingAsync } from '../persistentSettings';
import { rebuildIndex } from '../searchIndex';
import type { Card } from '../types';

type Workspace = { id: string; name: string; createdAt: number; updatedAt: number };

const WORKSPACES_KEY = 'pharmabrain_workspaces_v1';
const ACTIVE_WORKSPACE_KEY = 'pharmabrain_active_workspace_v1';
const DEFAULT_WORKSPACE_ID = 'workspace-default';
const INITIAL_LOAD_SEED_COUNT = 6;

function buildWorkspaceSeedCards(workspaceId: string, limit: number): Card[] {
    const seeds = initialCards.slice(0, Math.min(limit, initialCards.length));
    const seedIds = new Set(seeds.map(card => card.id));
    const now = Date.now();
  
    return seeds.map((card) => ({
      ...card,
      id: `${workspaceId}-${card.id}`,
      workspaceId,
      createdAt: now,
      updatedAt: now,
      manualConnections: card.manualConnections
        ?.filter(targetId => seedIds.has(targetId))
        .map(targetId => `${workspaceId}-${targetId}`)
    }));
}

export function useAppInitialization() {
    const { cards, setIsLoading, setCards } = useCardStore();
    const [semanticReady, setSemanticReady] = useState(false);
    const [embeddingsReady, setEmbeddingsReady] = useState(false);

    // Initialize semantic search (loads model in background)
    useEffect(() => {
        let lastLog = 0;
        initSemanticSearch(
        (progress) => {
            if (progress >= 100 || progress - lastLog >= 10) {
            lastLog = progress;
            }
        },
        () => {
            setSemanticReady(true);
        }
        );
    }, []);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (window.electronAPI?.loadAbbreviations) {
                    const savedAbbrevs = await window.electronAPI.loadAbbreviations();
                    const { loadLearnedAbbreviations } = await import('../learnedAbbreviations');
                    loadLearnedAbbreviations(savedAbbrevs);
                }

                loadFeedback();

                const [loadedCards, storedWorkspaces, storedActiveWorkspace] = await Promise.all([
                    loadCardsAsync(),
                    loadSettingAsync<Workspace[]>(WORKSPACES_KEY, []),
                    loadSettingAsync<string>(ACTIVE_WORKSPACE_KEY, DEFAULT_WORKSPACE_ID)
                ]);

                const normalizedWorkspaces = storedWorkspaces.length > 0
                    ? storedWorkspaces
                    : [{ id: DEFAULT_WORKSPACE_ID, name: 'Espace principal', createdAt: Date.now(), updatedAt: Date.now() }];

                const workspaceIdSet = new Set(normalizedWorkspaces.map(w => w.id));
                const migratedCards = loadedCards.map(card => {
                    const workspaceId = card.workspaceId && workspaceIdSet.has(card.workspaceId)
                    ? card.workspaceId
                    : normalizedWorkspaces[0].id;
                    return { ...card, workspaceId };
                });

                const activeWorkspace = normalizedWorkspaces.some(w => w.id === storedActiveWorkspace)
                    ? storedActiveWorkspace
                    : normalizedWorkspaces[0].id;

                await Promise.all([
                    saveSettingAsync(WORKSPACES_KEY, normalizedWorkspaces),
                    saveSettingAsync(ACTIVE_WORKSPACE_KEY, activeWorkspace)
                ]);

                let finalCards: Card[] = migratedCards;

                if (finalCards.length === 0) {
                    finalCards = buildWorkspaceSeedCards(activeWorkspace, INITIAL_LOAD_SEED_COUNT);
                    await saveCardsAsync(finalCards);
                }

                setCards(finalCards, true);
            } catch (e) {
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [setIsLoading, setCards]);

    // Use a ref to ensure this only runs once
    const hasInitializedSearchRef = useRef(false);

    // Build embeddings & learn abbreviations
    useEffect(() => {
        if (cards.length > 0 && !hasInitializedSearchRef.current) {
            hasInitializedSearchRef.current = true;

            import('../learnedAbbreviations').then(({ learnFromCards, getLearnedAbbreviations }) => {
                learnFromCards(cards);
                if (window.electronAPI?.saveAbbreviations) {
                    window.electronAPI.saveAbbreviations(getLearnedAbbreviations());
                }
            });

            // Rebuild FlexSearch index on initial load
            rebuildIndex(cards);

            if (semanticReady) {
                setEmbeddingsReady(false);
                buildCardEmbeddings(cards)
                    .then(() => setEmbeddingsReady(true))
                    .catch(console.error);
            }
        }
    }, [cards, semanticReady]);

    // Note: saveCardsAsync is called explicitly in each store action (handleSaveCard,
    // confirmDelete, handleBatchImport, handleSuppressConnections). No effect needed here.

    return { semanticReady, embeddingsReady };
}
