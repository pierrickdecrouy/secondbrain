import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircleNotch } from '@phosphor-icons/react';
import { useNavigation } from './hooks/useNavigation';
import { useReviewSession } from './hooks/useReviewSession';
import { useFilteredCards } from './hooks/useFilteredCards';
import { useCardStore } from './store/useCardStore';
import { useUIStore } from './store/useUIStore';
import { useCurrentSection } from './hooks/useCurrentSection';
import { getLinkFeedback } from './linkFeedback';
import { useAppInitialization } from './hooks/useAppInitialization';

// Pages
import { HomePage } from './components/HomePage';
import { StatsPage } from './components/StatsPage';
import { AddDataPage } from './components/AddDataPage';
import { ReviewHubPage } from './components/ReviewHubPage';
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const CoursesPage = lazy(() => import('./components/CoursesPage').then(m => ({ default: m.CoursesPage })));
const BrowsePage = lazy(() => import('./components/BrowsePage').then(m => ({ default: m.BrowsePage })));
const NetworkView = lazy(() => import('./components/NetworkView').then(m => ({ default: m.NetworkView })));

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

export function AppRouter() {
    const { cards, handleSaveCard, handleBatchImport, handleSuppressConnections } = useCardStore();
    const { 
        searchQuery, 
        activeFilters, 
        viewMode,
        setAddDataMode
    } = useUIStore();
    
    const activeSection = useCurrentSection();
    const { embeddingsReady } = useAppInitialization();

    const {
        selectedCardId,
        setSelectedCardId,
        pendingClusterReview,
        setPendingClusterReview,
        networkPanelPinned,
        setNetworkPanelPinned,
        pinnedCardId,
        setPinnedCardId,
        navigateSection
    } = useNavigation();

    const {
        startFSRSReview,
        startIntensiveReview,
        startCourseReview,
        startQuizReview,
        startCustomReview,
        setReviewSession
    } = useReviewSession(cards);

    const { filteredCards, searchResultIds } = useFilteredCards(cards, searchQuery, activeFilters);

    const isNetworkContext =
        activeSection === "network" ||
        (activeSection === "cards" && (viewMode === "network" || viewMode === "split"));

    const selectedCard = React.useMemo(() => {
        const panelCardId = networkPanelPinned && pinnedCardId ? pinnedCardId : selectedCardId;
        if (!panelCardId) return null;
        return cards.find((c) => c.id === panelCardId) ?? null;
    }, [cards, selectedCardId, networkPanelPinned, pinnedCardId]);

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
                const next = !networkPanelPinned;
                setNetworkPanelPinned(next);
                if (next && selectedCard) {
                    setPinnedCardId(selectedCard.id);
                }
                if (!next) {
                    setPinnedCardId(null);
                }
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
                                title: "Révision par Cluster",
                            });
                        }}
                    />
                </Suspense>
            )}
        />
    );

    return (
        <Routes>
            <Route path="/" element={<HomePage onNavigate={navigateSection} onAddCard={() => navigateSection("add")} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            
            <Route path="/settings" element={
                <Suspense fallback={<LoadingFallback />}>
                    <SettingsPage onClose={() => navigateSection("dashboard")} />
                </Suspense>
            } />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/add" element={
                <AddDataPage
                    existingCards={cards}
                    onSave={(card) => {
                        handleSaveCard(card);
                        setAddDataMode("none");
                    }}
                    onImport={async (newCards) => {
                        await handleBatchImport(newCards);
                        navigateSection("cards");
                    }}
                />
            } />
            
            <Route path="/review" element={
                <ReviewHubPage
                    onSelectFSRS={startFSRSReview}
                    onSelectCluster={() => {
                        navigateSection('/network' as any); // Workaround startClusterReviewMode
                        setPendingClusterReview(true);
                    }}
                    onSelectIntensive={startIntensiveReview}
                    onSelectCourse={(courseId) => {
                        const course = cards.find(c => c.id === courseId);
                        startCourseReview(courseId, `Révision — ${course?.title || 'Cours'}`);
                    }}
                    onSelectQuiz={startQuizReview}
                    onSelectCustom={startCustomReview}
                    hasEnoughCardsForCluster={
                        cards.filter((c) => c.manualConnections && c.manualConnections.length > 0).length >= 1
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
}
