import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import type { Card } from './types';
import { COURSE_TYPE } from './types';
import { hybridSearch } from './searchIndex';
import { calculateQualityScore } from './algorithms/qualityScoring';
import { calculateFsrsProgress } from './algorithms/fsrs';
import { getLinkFeedback } from './linkFeedback';
import { useAppInitialization } from './hooks/useAppInitialization';
import { AppLayout } from './components/AppLayout';
import { DetailModal } from './components/DetailModal';
import { AddDataModal } from './components/AddDataModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './components/HomePage';
import { CoursesPage } from './components/CoursesPage';
import { StatsPage } from './components/StatsPage';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { ReviewHubPage } from './components/ReviewHubPage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PencilSimple, Trash, CircleNotch } from '@phosphor-icons/react';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load heavy components
const NetworkView = lazy(() => import('./components/NetworkView').then(module => ({ default: module.NetworkView })));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const BrowsePage = lazy(() => import('./components/BrowsePage').then(module => ({ default: module.BrowsePage })));


type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats';

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

  const { embeddingsReady } = useAppInitialization();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
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
        isNetworkOnly={activeSection === 'network'}
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

  return (
    <AppLayout 
      onNavigate={navigateSection}
      onNavigateSettings={() => navigateSection('settings')}
      pendingClusterReview={pendingClusterReview}
      onCancelClusterReview={() => setPendingClusterReview(false)}
    >
      <Suspense fallback={<LoadingFallback />}>
        {renderMainContent()}
      </Suspense>
      {modals}
    </AppLayout>
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
      {indexingProgress !== null && (
        <div className="fixed bottom-5 right-5 bg-white dark:bg-slate-800 px-5 py-3 rounded-xl shadow-lg z-[9999] flex items-center gap-3 border border-slate-200 dark:border-slate-700">
          <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Indexation sémantique : {indexingProgress}%
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
