import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigation } from "./hooks/useNavigation";
import { useReviewSession } from "./hooks/useReviewSession";
import { useFilteredCards } from "./hooks/useFilteredCards";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import type { Card } from "./types";
import { COURSE_TYPE } from "./types";
import { calculateFsrsProgress } from "./algorithms/fsrs";
import { getLinkFeedback } from "./linkFeedback";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { DetailModal } from "./components/DetailModal";
import { AddDataModal } from "./components/AddDataModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./components/LoginPage";
import { UpsellModal } from "./components/UpsellModal";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { useTier } from "./lib/useTier";
import { scheduleLocalNotification } from "./lib/notifications";
import { HomePage } from "./components/HomePage";
import { CoursesPage } from "./components/CoursesPage";
import { StatsPage } from "./components/StatsPage";
import { ReviewSessionModal } from "./components/ReviewSessionModal";
import { ReviewHubPage } from "./components/ReviewHubPage";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { PencilSimple, Trash, CircleNotch } from "@phosphor-icons/react";
import { ThemeProvider } from "./context/ThemeContext";

// Lazy load heavy components
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

type AppSection =
  | "dashboard"
  | "cards"
  | "courses"
  | "network"
  | "review"
  | "settings"
  | "stats";

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
    activeSection,
    setActiveSection,
  } = useUIStore();

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
      setActiveSection("cards");
    },
    [handleBatchImport, setActiveSection],
  );

  const selectedCard = useMemo(() => {
    const panelCardId =
      networkPanelPinned && pinnedCardId ? pinnedCardId : selectedCardId;
    if (!panelCardId) return null;
    return cards.find((c) => c.id === panelCardId) ?? null;
  }, [cards, selectedCardId, networkPanelPinned, pinnedCardId]);

  const handleRateCard = useCallback(
    (cardId: string, rating: 1 | 2 | 3) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const nextProgress = calculateFsrsProgress(card.progress, rating, card.type === COURSE_TYPE);
      handleSaveCardWrapped({
        ...card,
        progress: nextProgress,
        updatedAt: Date.now(),
      });
    },
    [cards, handleSaveCardWrapped],
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


  const renderMainContent = () => {
    if (activeSection === "dashboard") {
      return (
        <HomePage
          onNavigate={(section) => navigateSection(section as AppSection)}
          onAddCard={() => setAddDataMode("create")}
        />
      );
    }

    if (activeSection === "settings") {
      if (!canAccess('settings')) {
        setUpsellFeature('settings');
        return <HomePage onNavigate={(s) => navigateSection(s as any)} onAddCard={() => setAddDataMode("create")} />;
      }
      return <SettingsPage onClose={() => navigateSection("dashboard")} />;
    }
    if (activeSection === "stats") {
      if (!canAccess('stats')) {
        setUpsellFeature('stats');
        return <HomePage onNavigate={(s) => navigateSection(s as any)} onAddCard={() => setAddDataMode("create")} />;
      }
      return <StatsPage />;
    }

    if (activeSection === "review") {
      return (
        <ReviewHubPage
          onSelectFSRS={startFSRSReview}
          onSelectCluster={startClusterReviewMode}
          onSelectIntensive={startIntensiveReview}
          totalDue={
            cards.filter(
              (c) =>
                c.progress?.status === "review" &&
                c.progress.dueDate &&
                new Date(c.progress.dueDate) <= new Date(),
            ).length
          }
          hasEnoughCardsForCluster={
            cards.filter(
              (c) => c.manualConnections && c.manualConnections.length > 0,
            ).length >= 1
          }
        />
      );
    }

    if (activeSection === "courses") {
      return <CoursesPage />;
    }

    return (
      <BrowsePage
        isNetworkOnly={activeSection === "network"}
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
  };

  const modals = (
    <>
      {selectedCard && !isNetworkContext && (
        <DetailModal
          card={selectedCard}
          allCards={cards}
          onClose={() => setSelectedCardId(null)}
          onLinkClick={(id) => setSelectedCardId(id)}
          actions={
            <div className="modal-actions">
              <button
                className="btn-icon"
                onClick={() => handleEditCard(selectedCard)}
                title="Modifier"
              >
                <PencilSimple size={18} />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDeleteCard(selectedCard)}
                title="Supprimer"
              >
                <Trash size={18} />
              </button>
            </div>
          }
          onNext={() => {
            const idx = filteredCards.findIndex((c) => c.id === selectedCardId);
            if (idx >= 0 && idx < filteredCards.length - 1) {
              setSelectedCardId(filteredCards[idx + 1].id);
            }
          }}
          onPrev={() => {
            const idx = filteredCards.findIndex((c) => c.id === selectedCardId);
            if (idx > 0) {
              setSelectedCardId(filteredCards[idx - 1].id);
            }
          }}
        />
      )}

      {addDataMode !== "none" && (
        <AddDataModal
          mode={
            addDataMode === "create" || addDataMode === "import"
              ? addDataMode
              : "edit"
          }
          card={editingCard}
          existingCards={cards}
          onSave={handleSaveCardWrapped}
          onImport={handleBatchImportWrapped}
          onClose={() => {
            setAddDataMode("none");
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
      onNavigateSettings={() => {
        if (!canAccess('settings')) {
          setUpsellFeature('settings');
          return;
        }
        navigateSection("settings");
      }}
      pendingClusterReview={pendingClusterReview}
      onCancelClusterReview={() => setPendingClusterReview(false)}
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
