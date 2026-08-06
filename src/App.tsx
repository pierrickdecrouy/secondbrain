import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useNavigation } from "./hooks/useNavigation";
import { useReviewSession } from "./hooks/useReviewSession";
import { useFilteredCards } from "./hooks/useFilteredCards";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import type { Card } from "./types";
import { calculateFsrsProgress } from "./algorithms/fsrs";
import { getLinkFeedback } from "./linkFeedback";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAuth } from "./context/AuthContext";

import { AddDataPage } from "./components/AddDataPage";
import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./components/LoginPage";
import { UpsellModal } from "./components/UpsellModal";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { useTier } from "./lib/useTier";
import { scheduleLocalNotification } from "./lib/notifications";
import { HomePage } from "./components/HomePage";
import { StatsPage } from "./components/StatsPage";
import { ReviewHubPage } from "./components/ReviewHubPage";
import { AppModals } from "./components/AppModals";
import { CircleNotch } from "@phosphor-icons/react";
import { ThemeProvider } from "./context/ThemeContext";
import { useCurrentSection } from "./hooks/useCurrentSection";

// Lazy load heavy components
const CoursesPage = lazy(() => import("./components/CoursesPage").then(m => ({ default: m.CoursesPage })));
const NetworkView = lazy(() =>
  import("./components/NetworkView").then((module) => ({
    default: module.NetworkView,
  })),
);
const SettingsPage = lazy(() => import("./components/SettingsPage"));
const BrowsePage = lazy(() =>
  import("./components/BrowsePage").then((module) => ({
    default: module.BrowsePage,
  })),
);

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

import { useCardStore } from "./store/useCardStore";
import { useUIStore } from "./store/useUIStore";
import { useTaskStore } from "./store/useTaskStore";

function AppContent() {
  const { user } = useAuth();
  const [bypassLogin, setBypassLogin] = useState(false);
  const { canAccess } = useTier();
  const [upsellFeature, setUpsellFeature] = useState<string | null>(null);
  const { hasCompletedOnboarding } = useUIStore();

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
    setCardToDelete,
  } = useCardStore();

  const {
    activeFilters,
    searchQuery,
    viewMode,
    addDataMode,
    setAddDataMode,
  } = useUIStore();

  const activeSection = useCurrentSection();

  const location = useLocation();



  const { embeddingsReady } = useAppInitialization();

  // Activer la synchronisation Firebase en temps réel
  useFirebaseSync();

  // Auto-complete onboarding if the user already has cards (e.g. connected on a new device)
  useEffect(() => {
    if (!hasCompletedOnboarding && cards.length > 0) {
      useUIStore.getState().completeOnboarding();
    }
  }, [cards.length, hasCompletedOnboarding]);

  // Check due cards for local notification
  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    
    const dueCount = cards.filter(
      (c) =>
        c.progress?.status === "review" &&
        c.progress.dueDate &&
        new Date(c.progress.dueDate) <= new Date()
    ).length;

    if (dueCount > 0) {
      scheduleLocalNotification(
        "Extnd. — Révisions FSRS",
        `Vous avez ${dueCount} fiche${dueCount > 1 ? 's' : ''} à réviser aujourd'hui. Ne perdez pas le fil !`,
        '/review'
      );
    }
  }, [cards, hasCompletedOnboarding]);

  const {
    selectedCardId,
    setSelectedCardId,
    pendingClusterReview,
    setPendingClusterReview,
    networkPanelPinned,
    setNetworkPanelPinned,
    pinnedCardId,
    setPinnedCardId,
    navigateSection,
    startClusterReviewMode,
  } = useNavigation();

  const {
    reviewSession,
    setReviewSession,
    reviewSessionCards,
    startFSRSReview,
    startIntensiveReview,
    startCourseReview,
    startQuizReview,
    startCustomReview,
  } = useReviewSession(cards);

  const handleEditCard = useCallback(
    (card: Card) => {
      setEditingCard(card);
      setAddDataMode("edit");
      setSelectedCardId(null);
    },
    [setEditingCard, setAddDataMode, setSelectedCardId],
  );

  const handleSaveCardWrapped = useCallback(
    (card: Card) => {
      handleSaveCard(card);
      setAddDataMode("none");
      setEditingCard(null);
    },
    [handleSaveCard, setAddDataMode, setEditingCard],
  );

  // Silent variant used for review ratings: does NOT close the edit modal or reset addDataMode.
  const handleSaveCardSilent = useCallback(
    (card: Card) => {
      handleSaveCard(card);
    },
    [handleSaveCard],
  );

  const confirmDeleteWrapped = useCallback(() => {
    if (cardToDelete) {
      if (selectedCardId === cardToDelete.id) {
        setSelectedCardId(null);
      }
      confirmDelete();
    }
  }, [cardToDelete, selectedCardId, confirmDelete, setSelectedCardId]);

  const handleBatchImportWrapped = useCallback(
    async (newCards: Card[]) => {
      await handleBatchImport(newCards);
      navigateSection("cards");
    },
    [handleBatchImport, navigateSection],
  );

  const selectedCard = useMemo(() => {
    const panelCardId =
      networkPanelPinned && pinnedCardId ? pinnedCardId : selectedCardId;
    if (!panelCardId) return null;
    return cards.find((c) => c.id === panelCardId) ?? null;
  }, [cards, selectedCardId, networkPanelPinned, pinnedCardId]);

  const handleRateCard = useCallback(
    (cardId: string, rating: 1 | 2 | 3 | 4) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const isCourseType = card.nodeType === 'course' || card.nodeType === 'concept';
      const nextProgress = calculateFsrsProgress(card.progress, rating, isCourseType);
      // Use silent save to avoid closing an open edit form during a concurrent review session.
      handleSaveCardSilent({
        ...card,
        progress: nextProgress,
        updatedAt: Date.now(),
      });
    },
    [cards, handleSaveCardSilent],
  );

  const isNetworkContext =
    activeSection === "network" ||
    (activeSection === "cards" &&
      (viewMode === "network" || viewMode === "split"));

  const { filteredCards, searchResultIds } = useFilteredCards(cards, searchQuery, activeFilters);

  useGlobalShortcuts({
    isNetworkContext,
    networkPanelPinned,
    setSelectedCardId,
    navigateSection,
  });

  const onResumeTask = useCallback((taskId: string) => {
    const taskStore = useTaskStore.getState();
    const task = taskStore.pausedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.type === 'review_session') {
      const state = task.state as { cardIds: string[], currentIndex: number, title?: string };
      if (!state.cardIds) return;
      
      const cardMap = new Map(cards.map(c => [c.id, c]));
      const sessionCards = state.cardIds.map(id => cardMap.get(id)).filter((c): c is Card => !!c);
      
      if (sessionCards.length > 0) {
        setReviewSession({
          title: state.title || 'Session de révision',
          cardIds: state.cardIds,
          initialIndex: state.currentIndex || 0
        });
      }
      taskStore.handleRemoveTask(taskId);
    }
  }, [cards, setReviewSession]);

  const renderBrowsePage = (isNetworkOnly: boolean) => (
    <BrowsePage
      isNetworkOnly={isNetworkOnly}
      networkPanelCard={isNetworkContext ? selectedCard : null}
      networkPanelPinned={networkPanelPinned}
      onNetworkPanelClose={() => {
        setSelectedCardId(null);
        if (!networkPanelPinned) {
          setPinnedCardId(null);
        }
      }}
      onNetworkPanelPinToggle={() => {
        setNetworkPanelPinned((prev) => {
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
            highlightedIds={
              searchResultIds ? new Set(searchResultIds) : undefined
            }
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
                title: "Révision par Cluster",
              });
            }}
          />
        </Suspense>
      )}
    />
  );

  const renderMainContent = () => {
    return (
      <Routes>
        <Route path="/" element={<HomePage onNavigate={navigateSection} onAddCard={() => navigateSection("add")} />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        <Route path="/settings" element={<SettingsPage onClose={() => navigateSection("dashboard")} />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/add" element={
          <AddDataPage
            existingCards={cards}
            onSave={handleSaveCardWrapped}
            onImport={handleBatchImportWrapped}
          />
        } />
        
        <Route path="/review" element={
          <ReviewHubPage
            onSelectFSRS={startFSRSReview}
            onSelectCluster={startClusterReviewMode}
            onSelectIntensive={startIntensiveReview}
            onSelectCourse={(courseId) => {
              const course = cards.find(c => c.id === courseId);
              startCourseReview(courseId, `Révision — ${course?.title || 'Cours'}`);
            }}
            onSelectQuiz={startQuizReview}
            onSelectCustom={startCustomReview}
            hasEnoughCardsForCluster={
              cards.filter(
                (c) => c.manualConnections && c.manualConnections.length > 0,
              ).length >= 1
            }
            courses={cards.filter(c => c.nodeType === 'course')}
            allCards={cards}
          />
        } />

        <Route path="/courses" element={
          <Suspense fallback={<LoadingFallback />}>
            <CoursesPage onStartReview={(cardIds, title) => setReviewSession({ cardIds, title })} />
          </Suspense>
        } />

        <Route path="/cards" element={renderBrowsePage(false)} />
        <Route path="/browse" element={<Navigate to="/cards" replace />} />
        <Route path="/network" element={renderBrowsePage(true)} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  const modals = (
    <AppModals
      selectedCard={selectedCard}
      isNetworkContext={isNetworkContext}
      cards={cards}
      setSelectedCardId={setSelectedCardId}
      handleEditCard={handleEditCard}
      handleDeleteCard={handleDeleteCard}
      filteredCards={filteredCards}
      selectedCardId={selectedCardId}
      addDataMode={addDataMode}
      editingCard={editingCard}
      handleSaveCardWrapped={handleSaveCardWrapped}
      handleBatchImportWrapped={handleBatchImportWrapped}
      setAddDataMode={setAddDataMode}
      setEditingCard={setEditingCard}
      cardToDelete={cardToDelete}
      confirmDeleteWrapped={confirmDeleteWrapped}
      setCardToDelete={setCardToDelete}
      reviewSession={reviewSession}
      reviewSessionCards={reviewSessionCards}
      setReviewSession={setReviewSession}
      handleRateCard={handleRateCard}
    />
  );

  if (!user && !bypassLogin) {
    return <LoginPage onBypass={() => setBypassLogin(true)} />;
  }

  return (
    <AppLayout
      onNavigate={(section) => {
        if (!canAccess(section)) {
          setUpsellFeature(section);
          return;
        }
        navigateSection(section);
      }}
      onNavigateSettings={() => navigateSection("settings")}
      pendingClusterReview={pendingClusterReview}
      onCancelClusterReview={() => setPendingClusterReview(false)}
      onResumeTask={onResumeTask}
    >
      <Suspense fallback={<LoadingFallback />}>{renderMainContent()}</Suspense>
      {modals}
      {!hasCompletedOnboarding && user && (
        <OnboardingWizard />
      )}
      <UpsellModal
        isOpen={!!upsellFeature}
        onClose={() => setUpsellFeature(null)}
        onSignIn={() => { setUpsellFeature(null); setBypassLogin(false); }}
        feature={upsellFeature ?? 'default'}
      />
    </AppLayout>
  );
}

function App() {
  // Global Indexing Progress State
  const [indexingProgress, setIndexingProgress] = useState<number | null>(null);


  useEffect(() => {
    // Bind the progress callback from semanticSearch to global App state
    // This allows AppContent to trigger indexing, and App to show the progress
    import("./semanticSearch").then(({ setIndexingProgressCallback }) => {
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
