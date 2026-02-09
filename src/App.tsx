import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Card } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { rebuildIndex, hybridSearch } from './searchIndex';
import { initSemanticSearch, buildCardEmbeddings } from './semanticSearch';
import { DetailModal } from './components/DetailModal';
import { NetworkView } from './components/NetworkView';
import { AddDataModal } from './components/AddDataModal';
import { HomePage } from './components/HomePage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import SettingsPage from './components/SettingsPage';
import { BrowsePage } from './components/BrowsePage';
import { Edit2, Trash2 } from 'lucide-react';

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

function App() {
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
      if (exists) {
        return prev.map(c => c.id === card.id ? card : c);
      }
      return [...prev, card];
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

  const handleBatchImport = useCallback((newCards: Card[]) => {
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
        />
      )}

      {addDataMode !== 'none' && (
        <AddDataModal
          mode={addDataMode === 'create' || addDataMode === 'import' ? addDataMode : 'edit'}
          card={editingCard}
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
    initSemanticSearch(
      undefined, // No progress callback needed
      () => setSemanticReady(true)
    );
  }, []);

  // Load cards and learned abbreviations on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load learned abbreviations first (if in Electron)
        if (window.electronAPI?.loadAbbreviations) {
          const savedAbbrevs = await window.electronAPI.loadAbbreviations();
          const { loadLearnedAbbreviations } = await import('./learnedAbbreviations');
          loadLearnedAbbreviations(savedAbbrevs);
        }

        const loadedCards = await loadCardsAsync();
        setCards(loadedCards);
      } catch (e) {
        console.error('Error loading cards:', e);
      } finally {
        setIsLoading(false);
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
        buildCardEmbeddings(cards).catch(console.error);
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
    // 1. Type filter
    let result = cards;
    if (activeFilters.length > 0) {
      result = result.filter(card => activeFilters.includes(card.type));
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
      <SettingsPage
        onClose={() => {
          setShowSettings(false);
          setShowHome(true);
        }}
      />
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
          <NetworkView
            cards={cards} // Pass all cards to preserve graph structure
            onNodeClick={(id) => setSelectedCardId(id)}
            searchQuery={searchQuery}
            activeFilters={activeFilters} // Pass filters for visualization dimming
          />
        )}
      />
      {modals}
    </>
  );
}

export default App;
