import { useState, useMemo, useEffect, useCallback, lazy, Suspense, type ReactElement } from 'react';
import type { Card } from './types';
import { COURSE_TYPE } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { initialCards } from './data';
import { rebuildIndex, hybridSearch } from './searchIndex';
import { initSemanticSearch, buildCardEmbeddings } from './semanticSearch';
import { calculateQualityScore } from './algorithms/qualityScoring';
import { calculateFsrsProgress } from './algorithms/fsrs';
import { loadFeedback, getLinkFeedback } from './linkFeedback';
import { loadSettingAsync, saveSettingAsync } from './persistentSettings';
import { DetailModal } from './components/DetailModal';
import { AddDataModal } from './components/AddDataModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './components/HomePage';
import { CoursesPage } from './components/CoursesPage';
import { StatsPage } from './components/StatsPage';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { ReviewHubPage } from './components/ReviewHubPage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PencilSimple, Trash, CircleNotch, House, ShareNetwork, ClockCounterClockwise, ChartBar, Stack, BookOpen, Graph, X, List } from '@phosphor-icons/react';
import { ThemeProvider } from './context/ThemeContext';

import { GlobalHeader } from './components/GlobalHeader';

// Lazy load heavy components
const NetworkView = lazy(() => import('./components/NetworkView').then(module => ({ default: module.NetworkView })));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const BrowsePage = lazy(() => import('./components/BrowsePage').then(module => ({ default: module.BrowsePage })));


type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats';
type Workspace = { id: string; name: string; createdAt: number; updatedAt: number };

const WORKSPACES_KEY = 'pharmabrain_workspaces_v1';
const ACTIVE_WORKSPACE_KEY = 'pharmabrain_active_workspace_v1';
const DEFAULT_WORKSPACE_ID = 'workspace-default';
const WORKSPACE_SEED_COUNT = 4;
const INITIAL_LOAD_SEED_COUNT = 6;

function buildWorkspaceSeedCards(workspaceId: string, limit = WORKSPACE_SEED_COUNT): Card[] {
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

import { useCardStore } from './store/useCardStore';
import { useUIStore } from './store/useUIStore';

function AppContent() {
  const { 
    cards, 
    isLoading, 
    handleSaveCard, 
    handleDeleteCard, 
    confirmDelete, 
    handleBatchImport, 
    handleSuppressConnections,
    editingCard,
    setEditingCard,
    cardToDelete,
    setCardToDelete 
  } = useCardStore();

  const { 
    activeFilters, 
    searchQuery, 
    viewMode, 
    setViewMode, 
    addDataMode, 
    setAddDataMode, 
    sidebarOpen, 
    setSidebarOpen,
    activeSection,
    setActiveSection
  } = useUIStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [semanticReady, setSemanticReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [pendingClusterReview, setPendingClusterReview] = useState(false);
  const [reviewSession, setReviewSession] = useState<{ cardIds: string[]; title: string } | null>(null);

  const [networkPanelPinned, setNetworkPanelPinned] = useState(false);
  const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);

  const handleEditCard = useCallback((card: Card) => {
    setEditingCard(card);
    setAddDataMode('edit');
    setSelectedCardId(null);
  }, []);

  const handleSaveCardWrapped = useCallback((card: Card) => {
    handleSaveCard(card);
    setAddDataMode('none');
    setEditingCard(null);
  }, [handleSaveCard, setAddDataMode, setEditingCard]);

  const confirmDeleteWrapped = useCallback(() => {
    if (cardToDelete) {
      if (selectedCardId === cardToDelete.id) {
        setSelectedCardId(null);
      }
      confirmDelete();
    }
  }, [cardToDelete, selectedCardId, confirmDelete]);

  const handleBatchImportWrapped = useCallback(async (newCards: Card[]) => {
    await handleBatchImport(newCards);
    setActiveSection('cards');
  }, [handleBatchImport, setActiveSection]);







  const workspaceCards = useMemo(
    () => cards,
    [cards]
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



  const startFSRSReview = useCallback(() => {
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

  const startClusterReviewMode = useCallback(() => {
    setActiveSection('network');
    setViewMode('network');
    setPendingClusterReview(true);
  }, []);

  const startIntensiveReview = useCallback(() => {
    // Shuffle all workspace cards
    const shuffled = [...workspaceCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(30, shuffled.length));
    setReviewSession({
      cardIds: selected.map(c => c.id),
      title: 'Bachotage Intensif'
    });
    setActiveSection('cards');
  }, [workspaceCards]);

  const handleRateCard = useCallback((cardId: string, rating: 1 | 2 | 3) => {
    const card = workspaceCards.find(c => c.id === cardId);
    if (!card) return;
    const nextProgress = calculateFsrsProgress(card.progress, rating);
    handleSaveCardWrapped({
      ...card,
      progress: nextProgress,
      updatedAt: Date.now()
    });
  }, [workspaceCards, handleSaveCardWrapped]);

  const isNetworkContext = activeSection === 'network' || (activeSection === 'cards' && (viewMode === 'network' || viewMode === 'split'));

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
          onSave={handleSaveCardWrapped}
          onImport={handleBatchImportWrapped}
          onClose={() => {
            setAddDataMode('none');
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
      useCardStore.getState().setIsLoading(true);
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

        let finalCards: Card[] = migratedCards;

        if (finalCards.length === 0) {
          console.log('No cards found, seeding starter cards.');
          finalCards = buildWorkspaceSeedCards(activeWorkspace, INITIAL_LOAD_SEED_COUNT);
          await saveCardsAsync(finalCards);
        }

        console.log(`Loaded ${finalCards.length} cards.`);
        useCardStore.getState().setCards(finalCards, true); // true = skipSave since we already loaded them
      } catch (e) {
        console.error('Error loading cards:', e);
      } finally {
        useCardStore.getState().setIsLoading(false);
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
        result = result.filter(card => activeFilters.includes(card.type) && card.type !== COURSE_TYPE);
      }
    } else {
      // Exclude courses from the main cards view by default
      result = result.filter(card => card.type !== COURSE_TYPE);
    }

    // 2. Search filter using hybrid (FlexSearch + semantic)
    if (searchResultIds !== null) {
      const idSet = new Set(searchResultIds);

      // Filter to only matching IDs and maintain search order (relevance)
      const idToCard = new Map(result.map(c => [c.id, c]));
      result = searchResultIds
        .filter(id => idSet.has(id) && idToCard.has(id))
        .map(id => idToCard.get(id)!)
        .filter(c => (activeFilters.length === 0 || activeFilters.includes(c.type)) && c.type !== COURSE_TYPE);
    }

    return result;
  }, [workspaceCards, searchResultIds, activeFilters]);



  const navigateSection = useCallback((section: AppSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setSelectedCardId(null); // Clear selected card when switching sections
    if (section === 'network') {
      setViewMode('network');
    }
    if (section === 'cards' && viewMode === 'network') {
      setViewMode('grid');
    }
    // Always clear pinned cards when changing tabs to prevent unwanted foreground cards
    setNetworkPanelPinned(false);
    setPinnedCardId(null);
  }, [viewMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('app-focus-search'));
      }
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        return;
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
  }, [isNetworkContext, networkPanelPinned, navigateSection, sidebarOpen]);

  const renderMainContent = () => {
    if (activeSection === 'dashboard') {
      return (
        <HomePage 
          onNavigate={(section) => navigateSection(section as AppSection)}
          onAddCard={() => setAddDataMode('create')}
        />
      );
    }

    if (activeSection === 'settings') {
      return (
        <SettingsPage onClose={() => navigateSection('dashboard')} />
      );
    }
    if (activeSection === 'stats') {
      return (
        <StatsPage />
      );
    }
    
    if (activeSection === 'review') {
      return (
        <ReviewHubPage 
          onSelectFSRS={startFSRSReview}
          onSelectCluster={startClusterReviewMode}
          onSelectIntensive={startIntensiveReview}
          totalDue={workspaceCards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date()).length}
          hasEnoughCardsForCluster={workspaceCards.filter(c => c.manualConnections && c.manualConnections.length > 0).length >= 1}
        />
      );
    }
    
    if (activeSection === 'courses') {
      return (
        <CoursesPage />
      );
    }

    return (
      <BrowsePage
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
              searchQuery={searchQuery}
              highlightedIds={searchResultIds ? new Set(searchResultIds) : undefined}
              activeFilters={activeFilters}
              onSuppressConnections={handleSuppressConnections}
              semanticReady={embeddingsReady}
              vetoPairs={getLinkFeedback().vetoPairs}
              typeCompat={getLinkFeedback().typePairScores}
              activeNodeId={selectedCard?.id}
              pendingClusterReview={pendingClusterReview}
              onStartClusterReview={(clusterNodeIds) => {
                  setPendingClusterReview(false);
                  if (clusterNodeIds.length === 0) return;
                  setReviewSession({
                      cardIds: clusterNodeIds,
                      title: 'Révision par Cluster'
                  });
              }}
            />
          </Suspense>
        )}
      />
    );
  };

  const navItems: Array<{ id: AppSection; label: string; icon: ReactElement }> = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: <House size={20} weight="fill" /> },
    { id: 'cards', label: 'Base de connaissances', icon: <Stack size={20} weight="fill" /> },
    { id: 'courses', label: 'Fiches de cours', icon: <BookOpen size={20} weight="fill" /> },
    { id: 'network', label: 'Graphe mental', icon: <ShareNetwork size={20} weight="bold" /> },
    { id: 'review', label: 'Sessions de révision', icon: <ClockCounterClockwise size={20} weight="bold" /> },
    { id: 'stats', label: 'Statistiques', icon: <ChartBar size={20} weight="bold" /> }
  ];

  const isHomeSection = activeSection === 'dashboard';

  return (
    <div className={`workspace-shell ${isHomeSection ? 'home-layout' : ''} ${sidebarOpen ? 'home-sidebar-open' : ''}`}>
      <div className="workspace-sidebar-container">
        <button className={`workspace-sidebar-backdrop ${sidebarOpen ? 'desktop-visible' : ''}`} aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />
        <aside className={`workspace-sidebar ${sidebarOpen ? 'open' : ''} home-overlay`}>
          <div className={`workspace-sidebar-header ${sidebarOpen ? 'open' : 'collapsed'}`}>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', color: 'var(--color-primary)' }}>
                <img src="/Logo-linear.svg" alt="Extnd" className="brand-logo-img" style={{ height: '32px' }} />
              </div>
            )}
            <div className="workspace-sidebar-actions">
              <button className="workspace-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Menu">
                <List size={20} weight="bold" />
              </button>
            </div>
          </div>

          <nav className="workspace-nav">
            {navItems.filter(i => i.id !== 'stats').map(item => (
              <button
                key={item.id}
                className={`workspace-nav-item ${activeSection === item.id ? 'active' : ''} ${sidebarOpen ? '' : 'collapsed'}`}
                onClick={() => {
                  navigateSection(item.id);
                  if (window.innerWidth <= 980) setSidebarOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="workspace-nav-bottom" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginBottom: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.filter(i => i.id === 'stats').map(item => (
              <button
                key={item.id}
                className={`workspace-nav-item ${activeSection === item.id ? 'active' : ''} ${sidebarOpen ? '' : 'collapsed'}`}
                onClick={() => {
                  navigateSection(item.id);
                  if (window.innerWidth <= 980) setSidebarOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <main className="workspace-main">
        <GlobalHeader 
          isHomeSection={isHomeSection} 
          onNavigateSettings={() => navigateSection('settings')} 
        />

        <div className="workspace-content-scroll" style={isHomeSection ? { padding: 0 } : {}}>
          {pendingClusterReview && activeSection === 'network' && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-3">
                <Graph size={20} weight="bold" />
                Veuillez sélectionner un noeud central pour réviser son cluster
                <button onClick={() => setPendingClusterReview(false)} className="ml-2 hover:bg-indigo-700 p-1 rounded-full transition-colors">
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary>
              {renderMainContent()}
            </ErrorBoundary>
          </Suspense>
        </div>
      </main>
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
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
