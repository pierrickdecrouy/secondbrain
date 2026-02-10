import React from 'react';
import {
    Search,
    Settings,
    Download,
    Plus,
    LayoutGrid,
    List,
    Share2,
    Pill,
    Activity,
    Zap,
    BarChart2,
    Edit2,
    Trash2,
    X
} from 'lucide-react';
import type { Card } from '../types';
import './BrowsePage.css';
import SearchSynthesis from './SearchSynthesis';
import { getTypeColor } from '../theme';
import { stripMarkdown } from '../utils';

const iconSvg = '/icon.svg';

// Type for ViewMode
type ViewMode = 'grid' | 'list' | 'network';

interface BrowsePageProps {
    cards: Card[];
    searchQuery: string;
    onSearchChange: (query: string) => void;

    // Filters
    activeFilters: string[];
    onFilterToggle: (type: string) => void;

    // Actions
    onHome: () => void;
    onSettings: () => void;
    onExport: () => void;
    onAddCard: () => void;

    // Card Actions
    onCardClick: (id: string) => void;
    onEditCard: (card: Card) => void;
    onDeleteCard: (card: Card) => void;

    // View Mode State
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;

    // Optional: Render prop for Network View to reuse existing component
    renderNetworkView?: () => React.ReactNode;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
    cards,
    searchQuery,
    onSearchChange,
    activeFilters,
    onFilterToggle,
    onHome,
    onSettings,
    onExport,
    onAddCard,
    onCardClick,
    onEditCard,
    onDeleteCard,
    viewMode,
    onViewModeChange,
    renderNetworkView
}) => {

    // Helper to get Icon for type
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'drug': return <Pill size={14} />;
            case 'patho': return <Activity size={14} />;
            case 'physio': return <Zap size={14} />;
            case 'data': return <BarChart2 size={14} />;
            default: return <Pill size={14} />;
        }
    };

    const getFilterLabel = (type: string) => {
        switch (type) {
            case 'drug': return 'Médicaments';
            case 'patho': return 'Pathologies';
            case 'physio': return 'Physiologie';
            case 'data': return 'Données';
            default: return type;
        }
    };

    return (
        <div className="browse-container">
            {/* Header Sticky */}
            <header className="browse-header app-drag-region">
                <div className="browse-header-left">
                    <button className="browse-logo-container" onClick={onHome}>
                        <img src={iconSvg} alt="PharmaBrain" className="browse-logo-img" />
                    </button>

                    <div className="browse-search-container">
                        <Search className="browse-search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher ..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            style={{ paddingRight: searchQuery ? '60px' : '40px' }}
                        />
                        {searchQuery && (
                            <button
                                className="browse-search-clear"
                                onClick={() => onSearchChange('')}
                                title="Effacer"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <span className="browse-shortcut-hint">⌘K</span>
                    </div>
                </div>

                <div className="browse-header-actions">
                    <button className="browse-btn-icon" title="Paramètres" onClick={onSettings}>
                        <Settings size={20} />
                    </button>
                    <button className="browse-btn-icon" title="Export" onClick={onExport}>
                        <Download size={20} />
                    </button>
                    <button className="browse-btn-primary" onClick={onAddCard}>
                        <Plus size={18} /> Nouvelle fiche
                    </button>
                </div>
            </header >

            {/* Toolbar Filters */}
            < div className="browse-toolbar" >
                <div className="browse-filter-group">
                    <div
                        className={`browse-filter-pill ${activeFilters.length === 0 ? 'active' : ''}`}
                        onClick={() => onFilterToggle('all')} // 'all' logic needs to be handled by parent or here. Assuming clearing filters.
                    >
                        Tous
                    </div>
                    {['data', 'drug', 'patho', 'physio'].map(type => (
                        <div
                            key={type}
                            className={`browse-filter-pill ${activeFilters.includes(type) ? 'active' : ''}`}
                            onClick={() => onFilterToggle(type)}
                        >
                            {getFilterLabel(type)}
                        </div>
                    ))}
                </div>

                {/* View Toggle */}
                <div className="browse-view-toggle">
                    <button
                        className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('grid')}
                    >
                        <LayoutGrid size={16} /> Grille
                    </button>
                    <button
                        className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('list')}
                    >
                        <List size={16} /> Liste
                    </button>
                    <button
                        className={`browse-view-btn ${viewMode === 'network' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('network')}
                    >
                        <Share2 size={16} /> Réseau
                    </button>
                </div>
            </div >

            {/* Main Content Area */}
            < main className="browse-content-area" >

                {/* Search Synthesis */}
                {searchQuery && (
                    <SearchSynthesis
                        query={searchQuery}
                        matchedCards={cards}
                        onCardClick={onCardClick}
                    />
                )}

                {viewMode === 'grid' && (
                    <div className="browse-card-grid">
                        {cards.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#868e96' }}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            cards.map((card, index) => ( // Index for animation delay if we want embedded styles, but CSS has it generic.
                                <div
                                    key={card.id}
                                    className="browse-card"
                                    onClick={() => onCardClick(card.id)}
                                    // Inline animation delay for first few items
                                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                >
                                    <div className="browse-card-header">
                                        <span
                                            className="browse-tag"
                                            style={{
                                                backgroundColor: getTypeColor(card.type),
                                                color: '#fff',
                                                border: 'none',
                                                textTransform: 'uppercase',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em'
                                            }}
                                        >
                                            {getTypeIcon(card.type)} {card.type}
                                        </span>
                                        <div className="browse-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button className="browse-action-btn" onClick={() => onEditCard(card)}><Edit2 size={16} /></button>
                                            <button className="browse-action-btn" onClick={() => onDeleteCard(card)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="browse-card-title">{card.title}</h3>
                                        <div className="browse-card-subtitle">{card.subtitle}</div>
                                        <p className="browse-card-desc" title={card.content}>
                                            {stripMarkdown(card.content)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {
                    viewMode === 'list' && (
                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
                            <table className="browse-list-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '100px' }}>Type</th>
                                        <th>Titre</th>
                                        <th>Sous-titre</th>
                                        <th>Extrait</th>
                                        <th style={{ width: '100px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cards.map(card => (
                                        <tr key={card.id} onClick={() => onCardClick(card.id)}>
                                            <td>
                                                <span
                                                    className="browse-tag"
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        backgroundColor: getTypeColor(card.type),
                                                        color: '#fff',
                                                        border: 'none'
                                                    }}
                                                >
                                                    {card.type}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{card.title}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#868e96' }}>{card.subtitle}</td>
                                            <td style={{ color: '#495057', fontSize: '0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {stripMarkdown(card.content)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                                    <button className="browse-action-btn" onClick={() => onEditCard(card)}><Edit2 size={16} /></button>
                                                    <button className="browse-action-btn" onClick={() => onDeleteCard(card)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                {
                    viewMode === 'network' && (
                        <div className="browse-network-container">
                            {renderNetworkView && renderNetworkView()}
                        </div>
                    )
                }

            </main >
        </div >
    );
};
