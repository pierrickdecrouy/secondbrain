import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Card, CardType } from './types';
import { loadCardsAsync, saveCardsAsync } from './storage';
import { CardItem } from './components/CardItem';
import { Omnibox } from './components/Omnibox';
import { DetailModal } from './components/DetailModal';
import { NetworkView } from './components/NetworkView';
import { CardForm } from './components/CardForm';
import { BatchImportModal } from './components/BatchImportModal';
import { HomePage } from './components/HomePage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ViewToggle, type ViewMode } from './components/ViewToggle';
import { Plus, Edit2, Upload, Trash2 } from 'lucide-react';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<CardType[]>([]);
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

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (activeFilters.length > 0 && !activeFilters.includes(card.type)) {
        return false;
      }
      if (viewMode === 'network') return true;
      if (!searchQuery) return true;

      // Enhanced search: Weighted scoring
      const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (queryWords.length === 0) return card.title.toLowerCase().includes(searchQuery.toLowerCase());

      let score = 0;
      const titleLower = card.title.toLowerCase();
      const subtitleLower = card.subtitle.toLowerCase();
      const contentLower = (card.content + ' ' + card.details).toLowerCase();
      const tagsLower = card.tags.map(t => t.toLowerCase());

      // Exact phrase match
      if (titleLower.includes(searchQuery.toLowerCase())) score += 100;
      if (contentLower.includes(searchQuery.toLowerCase())) score += 20;

      // Word matches
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 50; // High matches title
        if (subtitleLower.includes(word)) score += 30;
        tagsLower.forEach(tag => {
          if (tag.includes(word)) score += 40; // High match tags
        });
        if (contentLower.includes(word)) score += 10;
      });

      (card as any).searchScore = score; // Temporary property for sort (hacky but effective for memo)
      return score > 0;
    }).sort((a, b) => ((b as any).searchScore || 0) - ((a as any).searchScore || 0)); // Sort by relevance
  }, [cards, searchQuery, activeFilters, viewMode]);

  const gridFilteredCards = useMemo(() => {
    return cards.filter(card => {
      if (activeFilters.length > 0 && !activeFilters.includes(card.type)) {
        return false;
      }
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        card.title.toLowerCase().includes(query) ||
        card.subtitle.toLowerCase().includes(query) ||
        card.content.toLowerCase().includes(query) ||
        card.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [cards, searchQuery, activeFilters]);

  const handleFilterToggle = (type: CardType) => {
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

  const handleHomeSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setShowHome(false);
  }, []);

  const handleStartBrowsing = useCallback(() => {
    setShowHome(false);
  }, []);

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

  // Show home page
  if (showHome) {
    return (
      <div className="app-container">
        <HomePage
          onSearch={handleHomeSearch}
          onStartBrowsing={handleStartBrowsing}
          onAddCard={() => setShowForm(true)}
          onBatchImport={() => setShowImport(true)}
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
          />
        </div>
      </header>

      <div className={`main-content ${viewMode === 'network' ? 'network-mode' : ''}`}>
        {viewMode === 'grid' ? (
          gridFilteredCards.length > 0 ? (
            <div className="card-grid">
              {gridFilteredCards.map(card => (
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
          gridFilteredCards.length > 0 ? (
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
                  {gridFilteredCards.map(card => (
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
            cards={filteredCards}
            onNodeClick={(id) => setSelectedCardId(id)}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {modals}
    </div>
  );
}

export default App;
