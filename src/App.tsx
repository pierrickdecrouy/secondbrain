import { useState, useEffect, useCallback } from "react";
import { useLocation } from 'react-router-dom';
import { useNavigation } from "./hooks/useNavigation";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAuth } from "./context/AuthContext";
import { useAppEffects } from "./hooks/useAppEffects";

import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./components/LoginPage";
import { UpsellModal } from "./components/UpsellModal";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { useTier } from "./lib/useTier";
import { AppModals } from "./components/AppModals";

import { AppRouter } from "./Router";

import { useUIStore } from "./store/useUIStore";
import { useTaskStore } from "./store/useTaskStore";
import { useCardStore } from "./store/useCardStore";
import { useReviewStore } from "./store/useReviewStore";
import { useLLMStore } from "./store/useLLMStore";
import type { Card } from "./types";
import { AIAssistant } from "./components/AIAssistant";
import { Robot } from "@phosphor-icons/react";

function AppContent() {
  const { user } = useAuth();
  const [bypassLogin, setBypassLogin] = useState(false);
  const { canAccess } = useTier();
  const [upsellFeature, setUpsellFeature] = useState<string | null>(null);
  const { hasCompletedOnboarding } = useUIStore();
  const { cards } = useCardStore();
  const { setReviewSession } = useReviewStore();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const extndBotEnabled = useLLMStore(state => state.extndBotEnabled);

  useAppInitialization();
  useFirebaseSync();
  useAppEffects();

  const {
    pendingClusterReview,
    setPendingClusterReview,
    navigateSection,
  } = useNavigation();

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
      <AppRouter />
      <AppModals />
      {!hasCompletedOnboarding && user && (
        <OnboardingWizard />
      )}
      <UpsellModal
        isOpen={!!upsellFeature}
        onClose={() => setUpsellFeature(null)}
        onSignIn={() => { setUpsellFeature(null); setBypassLogin(false); }}
        feature={upsellFeature ?? 'default'}
      />
      
      {/* EXTND Bot FAB */}
      {extndBotEnabled && (
        <>
          <button
            onClick={() => setIsAIAssistantOpen(prev => !prev)}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-[1200] w-12 h-12 md:w-14 md:h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 md:border-4 border-white dark:border-slate-800"
            aria-label="EXTND Bot"
          >
            <Robot size={28} weight="duotone" />
          </button>

          <AIAssistant 
            isOpen={isAIAssistantOpen} 
            onClose={() => setIsAIAssistantOpen(false)} 
          />
        </>
      )}
    </AppLayout>
  );
}

function App() {
  const [indexingProgress, setIndexingProgress] = useState<number | null>(null);

  useEffect(() => {
    import("./semanticSearch").then(({ setIndexingProgressCallback }) => {
      setIndexingProgressCallback(setIndexingProgress);
    });
  }, []);

  return (
    <>
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
    </>
  );
}

export default App;
