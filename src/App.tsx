import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import type { Card } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { rebuildIndex, hybridSearch } from './searchIndex';
import { initSemanticSearch, buildCardEmbeddings } from './semanticSearch';
import { calculateQualityScore } from './algorithms/qualityScoring';
import { loadFeedback, recordNegativeFeedback, recordPositiveFeedback, getLinkFeedback } from './linkFeedback';
import { DetailModal } from './components/DetailModal';
import { AddDataModal } from './components/AddDataModal';
import { HomePage } from './components/HomePage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load heavy components
const NetworkView = lazy(() => import('./components/NetworkView').then(module => ({ default: module.NetworkView })));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const BrowsePage = lazy(() => import('./components/BrowsePage').then(module => ({ default: module.BrowsePage })));

type ViewMode = 'grid' | 'list' | 'network';

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
        <Loader2 className="animate-spin" size={48} />
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
  const [addDataMode, setAddDataMode] = useState<'none' | 'create' | 'edit' | 'import'>('none');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showHome, setShowHome] = useState(true); // Start on home page
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [semanticReady, setSemanticReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    setCards(prev => {
      const exists = prev.find(c => c.id === card.id);

      // Record positive feedback for new manual connections
      if (card.manualConnections && card.manualConnections.length > 0) {
        const oldCard = exists;
        const oldManual = new Set(oldCard?.manualConnections || []);
        card.manualConnections.forEach(targetId => {
          if (!oldManual.has(targetId)) {
            // New manual link — positive signal
            const targetCard = prev.find(c => c.id === targetId);
            if (targetCard) {
              recordPositiveFeedback(card, targetCard);
            }
          }
        });
      }

      if (exists) {
        return prev.map(c => c.id === card.id ? card : c);
      }
      return [...prev, card];
    });

    // Semantic Indexing: Force update for this specific card
    import('./semanticSearch').then(({ buildCardEmbeddings }) => {
      buildCardEmbeddings([card], true);
    });

    setAddDataMode('none');
    setEditingCard(null);
  }, []);

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
    // 1. Update React State (Optimistic UI)
    setCards(prev => {
      const merged = [...prev];
      newCards.forEach(nc => {
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
      const result = await window.electronAPI.importCards(newCards);
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
    buildCardEmbeddings(newCards, true);
  }, []);

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


  const selectedCard = useMemo(() =>
    cards.find(c => c.id === selectedCardId),
    [cards, selectedCardId]);

  const modals = (
    <>
      {selectedCard && (
        <DetailModal
          card={selectedCard}
          allCards={cards}
          onClose={() => setSelectedCardId(null)}
          onLinkClick={(id) => setSelectedCardId(id)}
          actions={
            <div className="modal-actions">
              <button className="btn-icon" onClick={() => handleEditCard(selectedCard)} title="Modifier">
                <Edit2 size={18} />
              </button>
              <button className="btn-icon" onClick={() => handleDeleteCard(selectedCard)} title="Supprimer">
                <Trash2 size={18} />
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
  // Load cards and learned abbreviations on mount
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
        const loadedCards = await loadCardsAsync();
        console.log(`Loaded ${loadedCards.length} cards.`);
        setCards(loadedCards);
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
    // Skip initial save and only save when we have data and loading is complete
    if (!isLoading && cards.length > 0) {
      saveCardsAsync(cards);
    }
  }, [cards, isLoading]);

  // Rebuild FlexSearch index when cards change
  useEffect(() => {
    if (cards.length > 0) {
      rebuildIndex(cards);
    }
  }, [cards]);

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
    let result = cards;
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
  }, [cards, searchResultIds, activeFilters]);

  const handleFilterToggle = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Show settings page
  if (showSettings) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SettingsPage
          onClose={() => {
            setShowSettings(false);
            setShowHome(true);
          }}
          availableCategories={Array.from(new Set(cards.map(c => c.type))).sort()}
          cards={cards}
          onReviewLowQuality={() => {
            setShowSettings(false);
            setActiveFilters(['needs-review']); // Trigger the special filter
            setShowHome(false); // Go to BrowsePage
          }}
        />
      </Suspense>
    );

  }

  // Show home page
  if (showHome) {
    return (
      <div className="app-container">
        <HomePage
          onSearch={(query) => {
            setSearchQuery(query);
            setShowHome(false);
          }}
          onStartBrowsing={() => setShowHome(false)}
          onAddCard={() => {
            // Stay on home page background
            setAddDataMode('create');
          }}
          onBatchImport={() => {
            setAddDataMode('import');
          }}
          onBackgroundExport={handleExportBackup}
          onSettings={() => {
            setShowHome(false);
            setShowSettings(true);
          }}
        />
        {modals}
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
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
          onHome={() => setShowHome(true)}
          onSettings={() => setShowSettings(true)}
          onExport={handleExportBackup}
          onAddCard={() => setAddDataMode('create')}
          onCardClick={(id) => setSelectedCardId(id)}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          renderNetworkView={() => (
            <Suspense fallback={<LoadingFallback />}>
              <NetworkView
                cards={filteredCards}
                onNodeClick={(id) => setSelectedCardId(id)}
                searchQuery={searchQuery}
                highlightedIds={searchResultIds ? new Set(searchResultIds) : undefined}
                activeFilters={activeFilters}
                onSuppressConnections={handleSuppressConnections}
                semanticReady={embeddingsReady}
                vetoPairs={getLinkFeedback().vetoPairs}
                typeCompat={getLinkFeedback().typePairScores} // We pass scores, logic inside handles matrix
              />
            </Suspense>
          )}
        />
      </Suspense>
      {modals}
    </>
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
          background: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #f3f3f3', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
            Indexation sémantique : {indexingProgress}%
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
