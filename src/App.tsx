import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Card, CardType } from './types';
import { loadCards, saveCards } from './storage';
import { CardItem } from './components/CardItem';
import { Omnibox } from './components/Omnibox';
import { DetailModal } from './components/DetailModal';
import { NetworkView } from './components/NetworkView';
import { CardForm } from './components/CardForm';
import { BatchImportModal } from './components/BatchImportModal';
import { ViewToggle, type ViewMode } from './components/ViewToggle';
import { Plus, Trash2, Edit2, Upload } from 'lucide-react';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<CardType[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Load cards from localStorage on mount
  useEffect(() => {
    setCards(loadCards());
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      saveCards(cards);
    }
  }, [cards]);

  const filteredCards = useMemo(() => {
    // For grid view: filter strictly
    // For network view: we might want different logic, but let's pass all cards to network 
    // and let it handle highlighting if we want to preserve context.
    // However, if the user explicitly filters by type, we should probably hide others.

    return cards.filter(card => {
      if (activeFilters.length > 0 && !activeFilters.includes(card.type)) {
        return false;
      }

      // If in network mode, we might want to return TRUE here to show all nodes 
      // but only highlight matches (handled in NetworkView).
      // But if we return true, then filteredCards has everything.
      // If we use grid mode, we want strict filtering.

      if (viewMode === 'network') return true;

      // Grid mode strict filtering
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const matchesTitle = card.title.toLowerCase().includes(query);
      const matchesSubtitle = card.subtitle.toLowerCase().includes(query);
      const matchesContent = card.content.toLowerCase().includes(query);
      const matchesTags = card.tags.some(tag => tag.toLowerCase().includes(query));

      return matchesTitle || matchesSubtitle || matchesContent || matchesTags;
    });
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
    if (confirm(`Supprimer la fiche "${card.title}" ?`)) {
      setCards(prev => prev.filter(c => c.id !== card.id));
      if (selectedCardId === card.id) {
        setSelectedCardId(null);
      }
    }
  }, [selectedCardId]);

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

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">
            Pharma<span>Brain</span>
          </h1>
          <p className="app-subtitle">Base de connaissances pour l'Internat de Pharmacie</p>
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
        ) : (
          <NetworkView
            cards={filteredCards}
            onNodeClick={(id) => setSelectedCardId(id)}
            searchQuery={searchQuery}
          />
        )}
      </div>

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
              <button className="btn-icon btn-danger" onClick={() => handleDeleteCard(selectedCard)} title="Supprimer">
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
    </div>
  );
}

export default App;
