import { useState, useMemo, useEffect, useCallback, lazy, Suspense, type ReactElement } from 'react';
import type { Card } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { rebuildIndex, hybridSearch } from './searchIndex';
import { initSemanticSearch, buildCardEmbeddings } from './semanticSearch';
import { calculateQualityScore } from './algorithms/qualityScoring';
import { calculateFsrsProgress } from './algorithms/fsrs';
import { loadFeedback, recordNegativeFeedback, recordPositiveFeedback, getLinkFeedback } from './linkFeedback';
import { loadSettingAsync, saveSettingAsync } from './persistentSettings';
import { DetailModal } from './components/DetailModal';
import { AddDataModal } from './components/AddDataModal';
import { HomePage } from './components/HomePage';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PencilSimple, Trash, CircleNotch, House, Cards, ShareNetwork, ClockCounterClockwise, GearSix, Plus, PencilSimpleLine, TrashSimple, SidebarSimple } from '@phosphor-icons/react';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load heavy components
const NetworkView = lazy(() => import('./components/NetworkView').then(module => ({ default: module.NetworkView })));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const BrowsePage = lazy(() => import('./components/BrowsePage').then(module => ({ default: module.BrowsePage })));

type ViewMode = 'grid' | 'list' | 'network';
type AppSection = 'dashboard' | 'cards' | 'network' | 'review' | 'settings';
type Workspace = { id: string; name: string; createdAt: number; updatedAt: number };

const WORKSPACES_KEY = 'pharmabrain_workspaces_v1';
const ACTIVE_WORKSPACE_KEY = 'pharmabrain_active_workspace_v1';
const DEFAULT_WORKSPACE_ID = 'workspace-default';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <CircleNotch className="animate-spin" size={48} />
        <p className="text-sm font-medium">Chargement...</p>
      </div>

    </div>
  );
}

function AppContent() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [addDataMode, setAddDataMode] = useState<'none' | 'create' | 'edit' | 'import'>('none');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [semanticReady, setSemanticReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [reviewSession, setReviewSession] = useState<{ cardIds: string[]; title: string } | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(DEFAULT_WORKSPACE_ID);
  const [networkPanelPinned, setNetworkPanelPinned] = useState(false);
  const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Manual Backup Feature
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharma-brain-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCard = useCallback((card: Card) => {
    const scopedCard = {
      ...card,
      workspaceId: card.workspaceId ?? activeWorkspaceId
    };
    setCards(prev => {
      const exists = prev.find(c => c.id === scopedCard.id);

      // Record positive feedback for new manual connections
      if (scopedCard.manualConnections && scopedCard.manualConnections.length > 0) {
        const oldCard = exists;
        const oldManual = new Set(oldCard?.manualConnections || []);
        scopedCard.manualConnections.forEach(targetId => {
          if (!oldManual.has(targetId)) {
            // New manual link — positive signal
            const targetCard = prev.find(c => c.id === targetId);
            if (targetCard) {
              recordPositiveFeedback(scopedCard, targetCard);
            }
          }
        });
      }

      if (exists) {
        return prev.map(c => c.id === scopedCard.id ? scopedCard : c);
      }
      return [...prev, scopedCard];
    });

    // Semantic Indexing: Force update for this specific card
    import('./semanticSearch').then(({ buildCardEmbeddings }) => {
      buildCardEmbeddings([scopedCard], true);
    });

    setAddDataMode('none');
    setEditingCard(null);
  }, [activeWorkspaceId]);

  const handleDeleteCard = useCallback((card: Card) => {
    setCardToDelete(card);
  }, []);

  const confirmDelete = useCallback(() => {
    if (cardToDelete) {
      setCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      if (selectedCardId === cardToDelete.id) {
        setSelectedCardId(null);
      }
      setCardToDelete(null);
    }
  }, [cardToDelete, selectedCardId]);

  const handleEditCard = useCallback((card: Card) => {
    setEditingCard(card);
    setAddDataMode('edit');
    setSelectedCardId(null);
  }, []);

  const handleBatchImport = useCallback(async (newCards: Card[]) => {
    const scopedCards = newCards.map(card => ({
      ...card,
      workspaceId: card.workspaceId ?? activeWorkspaceId
    }));
    // 1. Update React State (Optimistic UI)
    setCards(prev => {
      const merged = [...prev];
      scopedCards.forEach(nc => {
        const index = merged.findIndex(c => c.id === nc.id);
        if (index >= 0) {
          merged[index] = nc;
        } else {
          merged.push(nc);
        }
      });
      return merged;
    });

    // 2. Safe Bulk Upsert via Electron (No Delete!)
    if (window.electronAPI?.importCards) {
      const result = await window.electronAPI.importCards(scopedCards);
      if (!result.success) {
        console.error("Import failed:", result.error);
        alert("Erreur lors de la sauvegarde: " + result.error);
      }
    } else {
      // Fallback for web mode (if applicable, though request is Electron-specific)
      console.warn("importCards API not available, falling back to manual merge (unsaved to disk?)");
    }

    // 3. Trigger Semantic Indexing
    // Force update for imported cards (covers new AND updated ones)
    buildCardEmbeddings(scopedCards, true);
    setActiveSection('cards');
  }, [activeWorkspaceId]);

  const handleSuppressConnections = useCallback((pairs: { sourceId: string, targetId: string }[]) => {
    setCards(prev => {
      const cardMap = new Map(prev.map(c => [c.id, c]));
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

          // Record negative feedback — the algo learns from this
          if (target) {
            recordNegativeFeedback(source, target);
          }
        }
      });

      return hasChanges ? Array.from(cardMap.values()) : prev;
    });
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  const workspaceCards = useMemo(
    () => cards.filter(card => (card.workspaceId ?? DEFAULT_WORKSPACE_ID) === activeWorkspaceId),
    [cards, activeWorkspaceId]
  );

  const selectedCard = useMemo(() => {
    const panelCardId = networkPanelPinned && pinnedCardId ? pinnedCardId : selectedCardId;
    if (!panelCardId) return null;
    return workspaceCards.find(c => c.id === panelCardId) ?? null;
  }, [workspaceCards, selectedCardId, networkPanelPinned, pinnedCardId]);

  const reviewSessionCards = useMemo(() => {
    if (!reviewSession) return [];
    const idSet = new Set(reviewSession.cardIds);
    return workspaceCards.filter(card => idSet.has(card.id));
  }, [workspaceCards, reviewSession]);

  const openDueReviewSession = useCallback(() => {
    const now = Date.now();
    const dueCards = workspaceCards.filter(card => {
      const dueDate = card.progress?.dueDate ? new Date(card.progress.dueDate).getTime() : 0;
      if (!card.progress) return false;
      if (card.progress.status === 'learning' || card.progress.status === 'review') {
        return dueDate <= now;
      }
      return false;
    });
    const fallback = dueCards.length > 0 ? dueCards : workspaceCards.slice(0, 20);
    setReviewSession({
      cardIds: fallback.map(c => c.id),
      title: dueCards.length > 0 ? 'Révision planifiée (FSRS)' : 'Session découverte'
    });
    setActiveSection('cards');
  }, [workspaceCards]);

  const handleRateCard = useCallback((cardId: string, rating: 1 | 2 | 3) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const nextProgress = calculateFsrsProgress(card.progress, rating);
      return {
        ...card,
        progress: nextProgress,
        updatedAt: Date.now()
      };
    }));
  }, []);

  const isNetworkContext = activeSection === 'network' || (activeSection === 'cards' && viewMode === 'network');

  const modals = (
    <>
      {selectedCard && !isNetworkContext && (
        <DetailModal
          card={selectedCard}
          allCards={workspaceCards}
          onClose={() => setSelectedCardId(null)}
          onLinkClick={(id) => setSelectedCardId(id)}
          actions={
            <div className="modal-actions">
              <button className="btn-icon" onClick={() => handleEditCard(selectedCard)} title="Modifier">
                <PencilSimple size={18} />
              </button>
              <button className="btn-icon" onClick={() => handleDeleteCard(selectedCard)} title="Supprimer">
                <Trash size={18} />
              </button>
            </div>
          }
          onNext={() => {
            const idx = filteredCards.findIndex(c => c.id === selectedCardId);
            if (idx >= 0 && idx < filteredCards.length - 1) {
              setSelectedCardId(filteredCards[idx + 1].id);
            }
          }}
          onPrev={() => {
            const idx = filteredCards.findIndex(c => c.id === selectedCardId);
            if (idx > 0) {
              setSelectedCardId(filteredCards[idx - 1].id);
            }
          }}
        />
      )}

      {addDataMode !== 'none' && (
        <AddDataModal
          mode={addDataMode === 'create' || addDataMode === 'import' ? addDataMode : 'edit'}
          card={editingCard}
          existingCards={cards}
          onSave={handleSaveCard}
          onImport={handleBatchImport}
          onClose={() => {
            setAddDataMode('none');
            setEditingCard(null);
          }}
        />
      )}

      {cardToDelete && (
        <ConfirmDeleteModal
          title={cardToDelete.title}
          onConfirm={confirmDelete}
          onCancel={() => setCardToDelete(null)}
        />
      )}

      {reviewSession && reviewSessionCards.length > 0 && (
        <ReviewSessionModal
          cards={reviewSessionCards}
          allCards={cards}
          title={reviewSession.title}
          onClose={() => setReviewSession(null)}
          onRate={handleRateCard}
          onJumpToCard={(id) => setSelectedCardId(id)}
        />
      )}
    </>
  );


  // Initialize semantic search (loads model in background)
  useEffect(() => {
    console.log('Initializing semantic search...');
    let lastLog = 0;
    initSemanticSearch(
      (progress) => {
        // Log only every 10% or if it's done (100)
        if (progress >= 100 || progress - lastLog >= 10) {
          console.log(`Semantic model progress: ${Math.round(progress)}%`);
          lastLog = progress;
        }
      },
      () => {
        console.log('Semantic search ready!');
        setSemanticReady(true);
      }
    );
  }, []);
  // Load cards and workspace settings on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('Starting data load...');
      setIsLoading(true);
      try {
        // Load learned abbreviations first (if in Electron)
        if (window.electronAPI?.loadAbbreviations) {
          console.log('Loading abbreviations...');
          const savedAbbrevs = await window.electronAPI.loadAbbreviations();
          const { loadLearnedAbbreviations } = await import('./learnedAbbreviations');
          loadLearnedAbbreviations(savedAbbrevs);
        }

        // Load link feedback (self-learning patterns)
        loadFeedback();

        console.log('Loading cards...');
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

        console.log(`Loaded ${migratedCards.length} cards.`);
        setWorkspaces(normalizedWorkspaces);
        setActiveWorkspaceId(activeWorkspace);
        setCards(migratedCards);
      } catch (e) {
        console.error('Error loading cards:', e);
      } finally {
        setIsLoading(false);
        console.log('Data load complete.');
      }
    };
    loadData();
  }, []);

  // Learn abbreviations from cards and build embeddings when cards change
  useEffect(() => {
    if (cards.length > 0) {
      // Learn abbreviations from card content
      import('./learnedAbbreviations').then(({ learnFromCards, getLearnedAbbreviations }) => {
        learnFromCards(cards);

        // Persist learned abbreviations (if in Electron)
        if (window.electronAPI?.saveAbbreviations) {
          window.electronAPI.saveAbbreviations(getLearnedAbbreviations());
        }
      });

      // Build semantic embeddings when ready
      if (semanticReady) {
        setEmbeddingsReady(false);
        buildCardEmbeddings(cards)
          .then(() => {
            console.log('Embeddings built, precision graph can now compute');
            setEmbeddingsReady(true);
          })
          .catch(console.error);
      }
    }
  }, [cards, semanticReady]);



  // Save cards whenever they change (async for Electron support)
  useEffect(() => {
    // Skip initial save and only save when loading is complete
    if (!isLoading) {
      saveCardsAsync(cards);
    }
  }, [cards, isLoading]);

  // Rebuild FlexSearch index when cards change
  useEffect(() => {
    if (workspaceCards.length > 0) {
      rebuildIndex(workspaceCards);
    }
  }, [workspaceCards]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search results - async for hybrid search
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setSearchResultIds(null);
      return;
    }

    // Use hybrid search (keyword + semantic)
    hybridSearch(debouncedSearchQuery).then(setSearchResultIds);
  }, [debouncedSearchQuery]);

  const filteredCards = useMemo(() => {
    // 1. Type filter / Quality Filter
    let result = workspaceCards;
    if (activeFilters.length > 0) {
      if (activeFilters.includes('needs-review')) {
        // Quality Filter
        result = result.filter(card => {
          const score = calculateQualityScore(card, card.manualConnections?.length || 0);
          return score.score < 50;
        });
      } else {
        // Standard Type Filter
        result = result.filter(card => activeFilters.includes(card.type));
      }
    }

    // 2. Search filter using hybrid (FlexSearch + semantic)
    if (searchResultIds !== null) {
      const idSet = new Set(searchResultIds);

      // Filter to only matching IDs and maintain search order (relevance)
      const idToCard = new Map(result.map(c => [c.id, c]));
      result = searchResultIds
        .filter(id => idSet.has(id) && idToCard.has(id))
        .map(id => idToCard.get(id)!)
        .filter(c => activeFilters.length === 0 || activeFilters.includes(c.type));
    }

    return result;
  }, [workspaceCards, searchResultIds, activeFilters]);

  const handleFilterToggle = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const createWorkspace = async () => {
    const name = window.prompt('Nom du nouvel espace de travail :');
    if (!name?.trim()) return;
    const now = Date.now();
    const workspace: Workspace = {
      id: `workspace-${now}`,
      name: name.trim(),
      createdAt: now,
      updatedAt: now
    };
    const next = [...workspaces, workspace];
    setWorkspaces(next);
    setActiveWorkspaceId(workspace.id);
    await Promise.all([
      saveSettingAsync(WORKSPACES_KEY, next),
      saveSettingAsync(ACTIVE_WORKSPACE_KEY, workspace.id)
    ]);
  };

  const renameWorkspace = async () => {
    if (!activeWorkspace) return;
    const name = window.prompt('Renommer cet espace :', activeWorkspace.name);
    if (!name?.trim()) return;
    const next = workspaces.map(w => w.id === activeWorkspace.id
      ? { ...w, name: name.trim(), updatedAt: Date.now() }
      : w);
    setWorkspaces(next);
    await saveSettingAsync(WORKSPACES_KEY, next);
  };

  const deleteWorkspace = async () => {
    if (!activeWorkspace || workspaces.length <= 1) return;
    const confirmed = window.confirm(`Supprimer l'espace "${activeWorkspace.name}" et ses fiches ?`);
    if (!confirmed) return;
    const remaining = workspaces.filter(w => w.id !== activeWorkspace.id);
    const fallbackWorkspaceId = remaining[0].id;
    setCards(prev => prev.filter(c => (c.workspaceId ?? DEFAULT_WORKSPACE_ID) !== activeWorkspace.id));
    setWorkspaces(remaining);
    setActiveWorkspaceId(fallbackWorkspaceId);
    setSelectedCardId(null);
    setPinnedCardId(null);
    setNetworkPanelPinned(false);
    await Promise.all([
      saveSettingAsync(WORKSPACES_KEY, remaining),
      saveSettingAsync(ACTIVE_WORKSPACE_KEY, fallbackWorkspaceId)
    ]);
  };

  const navigateSection = useCallback((section: AppSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
    if (section === 'network') {
      setViewMode('network');
    }
    if (section === 'cards' && viewMode === 'network') {
      setViewMode('grid');
    }
    if (section !== 'network' && viewMode !== 'network') {
      setNetworkPanelPinned(false);
      setPinnedCardId(null);
    }
    if (section === 'review') {
      openDueReviewSession();
    }
  }, [viewMode, openDueReviewSession]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('app-focus-search'));
      }
      if (event.key === 'Escape' && isNetworkContext && !networkPanelPinned) {
        setSelectedCardId(null);
      }
      if (event.altKey && ['1', '2', '3', '4', '5'].includes(event.key)) {
        event.preventDefault();
        const mapping: Record<string, AppSection> = {
          '1': 'dashboard',
          '2': 'cards',
          '3': 'network',
          '4': 'review',
          '5': 'settings'
        };
        navigateSection(mapping[event.key]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNetworkContext, networkPanelPinned, navigateSection]);

  const renderMainContent = () => {
    if (activeSection === 'dashboard') {
      return (
        <HomePage
          cards={workspaceCards}
          onNavigateToCard={(id) => {
            setSelectedCardId(id);
            navigateSection('cards');
          }}
          onSearch={(query) => {
            setSearchQuery(query);
            navigateSection('cards');
          }}
          onStartBrowsing={() => navigateSection('cards')}
          onStartReviewSession={openDueReviewSession}
          onAddCard={() => setAddDataMode('create')}
          onBatchImport={() => setAddDataMode('import')}
          onBackgroundExport={handleExportBackup}
          onSettings={() => navigateSection('settings')}
        />
      );
    }

    if (activeSection === 'settings') {
      return (
        <SettingsPage
          onClose={() => navigateSection('dashboard')}
          availableCategories={Array.from(new Set(workspaceCards.map(c => c.type))).sort()}
          cards={workspaceCards}
          onReviewLowQuality={() => {
            setActiveFilters(['needs-review']);
            navigateSection('cards');
          }}
        />
      );
    }

    return (
      <BrowsePage
        cards={filteredCards}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onFilterToggle={(type) => {
          if (type === 'all') {
            if (activeFilters.length > 0) setActiveFilters([]);
          } else {
            handleFilterToggle(type);
          }
        }}
        onHome={() => navigateSection('dashboard')}
        onSettings={() => navigateSection('settings')}
        onExport={handleExportBackup}
        onAddCard={() => setAddDataMode('create')}
        onCardClick={(id) => {
          if (isNetworkContext && networkPanelPinned) {
            setPinnedCardId(id);
          }
          setSelectedCardId(id);
        }}
        onEditCard={handleEditCard}
        onDeleteCard={handleDeleteCard}
        viewMode={activeSection === 'network' ? 'network' : viewMode}
        onViewModeChange={setViewMode}
        networkPanelCard={isNetworkContext ? selectedCard : null}
        networkPanelPinned={networkPanelPinned}
        onNetworkPanelClose={() => {
          setSelectedCardId(null);
          if (!networkPanelPinned) {
            setPinnedCardId(null);
          }
        }}
        onNetworkPanelPinToggle={() => {
          setNetworkPanelPinned(prev => {
            const next = !prev;
            if (next && selectedCard) {
              setPinnedCardId(selectedCard.id);
            }
            if (!next) {
              setPinnedCardId(null);
            }
            return next;
          });
        }}
        renderNetworkView={() => (
          <Suspense fallback={<LoadingFallback />}>
            <NetworkView
              cards={filteredCards}
              onNodeClick={(id) => {
                if (networkPanelPinned) {
                  setPinnedCardId(id);
                }
                setSelectedCardId(id);
              }}
              onClusterReview={(clusterCardIds) => {
                setReviewSession({
                  cardIds: clusterCardIds,
                  title: `Cluster review (${clusterCardIds.length} fiches)`
                });
              }}
              searchQuery={searchQuery}
              highlightedIds={searchResultIds ? new Set(searchResultIds) : undefined}
              activeFilters={activeFilters}
              onSuppressConnections={handleSuppressConnections}
              semanticReady={embeddingsReady}
              vetoPairs={getLinkFeedback().vetoPairs}
              typeCompat={getLinkFeedback().typePairScores}
            />
          </Suspense>
        )}
      />
    );
  };

  const navItems: Array<{ id: AppSection; label: string; icon: ReactElement }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <House size={16} /> },
    { id: 'cards', label: 'Cartes', icon: <Cards size={16} /> },
    { id: 'network', label: 'Réseau', icon: <ShareNetwork size={16} /> },
    { id: 'review', label: 'Révision', icon: <ClockCounterClockwise size={16} /> },
    { id: 'settings', label: 'Paramètres', icon: <GearSix size={16} /> }
  ];

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="workspace-sidebar-header">
          <h3>Workspace</h3>
          <div className="workspace-sidebar-actions">
            <button className="workspace-btn" onClick={createWorkspace} title="Nouveau workspace">
              <Plus size={14} />
            </button>
            <button className="workspace-btn" onClick={renameWorkspace} disabled={!activeWorkspace} title="Renommer workspace">
              <PencilSimpleLine size={14} />
            </button>
            <button className="workspace-btn" onClick={deleteWorkspace} disabled={!activeWorkspace || workspaces.length <= 1} title="Supprimer workspace">
              <TrashSimple size={14} />
            </button>
          </div>
        </div>

        <select
          className="workspace-select"
          value={activeWorkspaceId}
          onChange={async (e) => {
            const next = e.target.value;
            setActiveWorkspaceId(next);
            setSelectedCardId(null);
            setPinnedCardId(null);
            setNetworkPanelPinned(false);
            setActiveFilters([]);
            setSearchQuery('');
            await saveSettingAsync(ACTIVE_WORKSPACE_KEY, next);
          }}
        >
          {workspaces.map(workspace => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>

        <nav className="workspace-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`workspace-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => navigateSection(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="workspace-main">
        <button className="workspace-mobile-menu" onClick={() => setSidebarOpen(prev => !prev)} title="Menu">
          <SidebarSimple size={18} />
        </button>
        <Suspense fallback={<LoadingFallback />}>
          {renderMainContent()}
        </Suspense>
      </div>
      {modals}
    </div>
  );
}

function App() {
  // Global Indexing Progress State
  const [indexingProgress, setIndexingProgress] = useState<number | null>(null);

  useEffect(() => {
    // Bind the progress callback from semanticSearch to global App state
    // This allows AppContent to trigger indexing, and App to show the progress
    import('./semanticSearch').then(({ setIndexingProgressCallback }) => {
      setIndexingProgressCallback(setIndexingProgress);
    });
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
      {/* Indexing Progress Indicator */}
      {indexingProgress !== null && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--color-surface)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--color-border)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
            Indexation sémantique : {indexingProgress}%
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
