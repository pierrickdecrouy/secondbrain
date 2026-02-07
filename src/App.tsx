import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Card } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { rebuildIndex, searchCards } from './searchIndex';
import { CardItem } from './components/CardItem';
import { Omnibox } from './components/Omnibox';
import { DetailModal } from './components/DetailModal';
import { NetworkView } from './components/NetworkView';
import { CardForm } from './components/CardForm';
import { BatchImportModal } from './components/BatchImportModal';
import { HomePage } from './components/HomePage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ViewToggle, type ViewMode } from './components/ViewToggle';
import { Plus, Edit2, Upload, Trash2, Download } from 'lucide-react';

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
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showHome, setShowHome] = useState(true); // Start on home page
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);

  // Load cards on mount (async for Electron support)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
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

  const filteredCards = useMemo(() => {
    // 1. Type filter
    let result = cards;
    if (activeFilters.length > 0) {
      result = result.filter(card => activeFilters.includes(card.type));
    }

    // 2. Search filter using FlexSearch
    if (debouncedSearchQuery) {
      const matchingIds = searchCards(debouncedSearchQuery);
      const idSet = new Set(matchingIds);

      // Filter to only matching IDs and maintain FlexSearch order (relevance)
      const idToCard = new Map(result.map(c => [c.id, c]));
      result = matchingIds
        .filter(id => idSet.has(id) && idToCard.has(id))
        .map(id => idToCard.get(id)!)
        .filter(c => activeFilters.length === 0 || activeFilters.includes(c.type));
    }

    return result;
  }, [cards, debouncedSearchQuery, activeFilters]);

  const handleFilterToggle = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectedCard = useMemo(() =>
    cards.find(c => c.id === selectedCardId),
    [cards, selectedCardId]);

  const handleSaveCard = useCallback((card: Card) => {
    setCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.map(c => c.id === card.id ? card : c);
      }
      return [...prev, card];
    });
    setShowForm(false);
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
    setShowForm(true);
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

      {showForm && (
        <CardForm
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={() => { setShowForm(false); setEditingCard(null); }}
        />
      )}

      {showImport && (
        <BatchImportModal
          onImport={handleBatchImport}
          onClose={() => setShowImport(false)}
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

  // Compute available types from current cards
  const availableTypes = useMemo(() => {
    const types = new Set(cards.map(c => c.type));
    return Array.from(types).sort();
  }, [cards]);

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
            setShowHome(false);
            setShowForm(true);
          }}
          onBatchImport={() => {
            setShowHome(false);
            setShowImport(true);
          }}
          onBackgroundExport={handleExportBackup}
        />
        {modals}
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <button className="home-btn" onClick={() => setShowHome(true)} title="Retour à l'accueil">
            <div className="header-logo-group">
              <div className="logo-gradient-header" />
            </div>
          </button>
        </div>

        <div className="header-controls">
          <div className="toolbar">
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

            <div className="toolbar-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={handleExportBackup} title="Sauvegarde de sécurité">
                <Download size={18} />
              </button>
              <button className="btn-secondary" onClick={() => setShowImport(true)} title="Import JSON">
                <Upload size={18} />
              </button>

              <button className="btn-primary add-btn" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                <span>Nouvelle fiche</span>
              </button>
            </div>
          </div>

          <Omnibox
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onFilterToggle={handleFilterToggle}
            availableTypes={availableTypes}
          />
        </div>
      </header>

      {/* Search Query Header */}
      {debouncedSearchQuery && (
        <div className="search-results-header" style={{
          padding: '1rem 2rem 0',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#475569' }}>
            Résultats de recherche pour : <span style={{ color: '#0d9488' }}>{debouncedSearchQuery}</span>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem' }}>
              ({filteredCards.length} résultats)
            </span>
          </h2>
        </div>
      )}

      <div className={`main-content ${viewMode === 'network' ? 'network-mode' : ''}`}>
        {viewMode === 'grid' ? (
          filteredCards.length > 0 ? (
            <div className="card-grid">
              {filteredCards.map(card => (
                <CardItem
                  key={card.id}
                  card={card}
                  onClick={(c) => setSelectedCardId(c.id)}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                />
              ))}
            </div>
          ) : (
            <div className="card-empty">
              <p>Aucun résultat trouvé</p>
            </div>
          )
        ) : viewMode === 'list' ? (
          filteredCards.length > 0 ? (
            <div className="card-list-container">
              <table className="card-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Type</th>
                    <th>Titre</th>
                    <th>Description</th>
                    <th style={{ width: '100px' }}>Tags</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map(card => (
                    <tr key={card.id} onClick={() => setSelectedCardId(card.id)} className="card-list-row">
                      <td>
                        <div className={`list-type-indicator type-${card.type}`} title={card.type}></div>
                      </td>
                      <td className="font-medium">{card.title}</td>
                      <td className="text-muted">{card.subtitle}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {card.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="list-tag">{tag}</span>
                          ))}
                          {card.tags.length > 2 && <span className="list-tag">+{card.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="btn-icon-small" onClick={() => handleEditCard(card)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon-small" onClick={() => handleDeleteCard(card)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-empty">
              <p>Aucun résultat trouvé</p>
            </div>
          )
        ) : (
          <NetworkView
            cards={cards} // Full graph context - highlighted nodes from searchQuery
            onNodeClick={(id) => setSelectedCardId(id)}
            searchQuery={searchQuery} // Highlighting handled by NetworkView
          />
        )}
      </div>

      {modals}
    </div>
  );
}

export default App;
