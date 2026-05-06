import React, { useState, useMemo } from 'react';
import {
    MagnifyingGlass,
    GearSix,
    DownloadSimple,
    Plus,
    SquaresFour,
    Rows,
    ShareNetwork,
    PencilSimple,
    Trash,
    X,
    ArrowsDownUp
} from '@phosphor-icons/react';
import type { Card } from '../types';
import './BrowsePage.css';
import SearchSynthesis from './SearchSynthesis';
import { useTheme } from '../context/ThemeContext';
import { stripMarkdown } from '../utils';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { DynamicIcon } from './DynamicIcon';
import iconSvg from '../../public/icon.svg';

// Type for ViewMode
type ViewMode = 'grid' | 'list' | 'network';

type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

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
    const { getCategoryColor, getCategoryIcon } = useTheme();
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');

    const getFilterLabel = (type: string) => {
        switch (type) {
            case 'drug': return 'Médicaments';
            case 'patho': return 'Pathologies';
            case 'physio': return 'Physiologie';
            case 'data': return 'Données';
            default: return type;
        }
    };

    const filteredCards = useMemo(() => {
        let result = cards;

        // 1. Filter by Type / Quality
        if (activeFilters.length > 0 && !activeFilters.includes('all')) {
            if (activeFilters.includes('needs-review')) {
                // Special case: Filter by quality < 50
                result = result.filter(card => {
                    const connectivity = card.manualConnections?.length || 0;
                    const assessment = calculateQualityScore(card, connectivity);
                    return assessment.score < 50;
                });
            } else {
                // Standard Type Filter
                result = result.filter(card => activeFilters.includes(card.type));
            }
        }

        return result;
    }, [cards, activeFilters]);

    const sortedCards = useMemo(() => {
        const sorted = [...filteredCards];
        switch (sortOption) {
            case 'name-asc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'name-desc':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            case 'type':
                return sorted.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
            case 'date-created-desc':
                return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            case 'date-created-asc':
                return sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            case 'date-modified-desc':
                return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            default:
                return sorted;
        }
    }, [cards, sortOption]);

    return (
        <div className="browse-container">
            {/* Header Sticky */}
            <header className="browse-header app-drag-region">
                <div className="browse-header-left">
                    <button className="browse-logo-container" onClick={onHome}>
                        <img src={iconSvg} alt="PharmaBrain" className="browse-logo-img" />
                    </button>

                    <div className="browse-search-container">
                        <MagnifyingGlass className="browse-search-icon" />
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
                        <GearSix size={20} />
                    </button>
                    <button className="browse-btn-icon" title="Export" onClick={onExport}>
                        <DownloadSimple size={20} />
                    </button>
                    <button className="browse-btn-primary" onClick={onAddCard}>
                        <Plus size={18} /> <span className="browse-btn-text">Nouvelle fiche</span>
                    </button>
                </div>
            </header >

            {/* Toolbar Filters */}
            <div className="browse-toolbar">
                <div className="browse-filter-scroll-area">
                    <div className="browse-filter-group">
                        <div
                            className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                            onClick={() => onFilterToggle('all')}
                        >
                            Tous
                        </div>
                        {Array.from(new Set(cards.map(c => c.type))).sort().map(type => (
                            <div
                                key={type}
                                className={`browse-filter-pill ${activeFilters.includes(type) ? 'active' : ''}`}
                                onClick={() => onFilterToggle(type)}
                                style={activeFilters.includes(type) ? { backgroundColor: getCategoryColor(type), borderColor: getCategoryColor(type), color: '#fff' } : {}}
                            >
                                {getFilterLabel(type)}
                            </div>
                        ))}
                        {/* special filter for review mode */}
                        {activeFilters.includes('needs-review') && (
                            <div
                                className="browse-filter-pill active"
                                onClick={() => onFilterToggle('needs-review')}
                                style={{ backgroundColor: '#f97316', borderColor: '#f97316', color: '#fff' }}
                            >
                                À réviser
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Sort Dropdown */}
                    {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="browse-view-toggle" style={{ padding: '2px' }}>
                            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <ArrowsDownUp size={14} style={{ position: 'absolute', left: '8px', pointerEvents: 'none', color: '#64748b' }} />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    style={{
                                        appearance: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '4px 8px 4px 28px',
                                        fontSize: '0.85rem',
                                        color: '#475569',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="name-asc">Nom (A-Z)</option>
                                    <option value="name-desc">Nom (Z-A)</option>
                                    <option value="type">Catégorie</option>
                                    <option value="date-created-desc">Plus récents (Création)</option>
                                    <option value="date-created-asc">Plus anciens (Création)</option>
                                    <option value="date-modified-desc">Dernière modif.</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="browse-view-toggle">
                        <button
                            className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('grid')}
                        >
                            <SquaresFour size={16} /> Grille
                        </button>
                        <button
                            className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('list')}
                        >
                            <Rows size={16} /> Liste
                        </button>
                        <button
                            className={`browse-view-btn ${viewMode === 'network' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('network')}
                        >
                            <ShareNetwork size={16} /> Réseau
                        </button>
                    </div>
                </div>
            </div >

            {/* Main Content Area */}
            <main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''}`}>

                {/* Search Synthesis */}
                {searchQuery && (
                    <SearchSynthesis
                        query={searchQuery}
                        matchedCards={sortedCards}
                        allCards={cards}
                        onCardClick={onCardClick}
                    />
                )}

                {viewMode === 'grid' && (
                    <div className="browse-card-grid">
                        {sortedCards.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#868e96' }}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            sortedCards.map((card, index) => ( // Index for animation delay if we want embedded styles, but CSS has it generic.
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
                                                backgroundColor: getCategoryColor(card.type),
                                                color: '#fff',
                                                border: 'none',
                                                textTransform: 'uppercase',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <DynamicIcon name={getCategoryIcon(card.type)} size={14} /> {card.type}
                                        </span>
                                        {/* Visual Badge for Low Quality (Only in Review Mode) */}
                                        {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                color: '#c2410c',
                                                backgroundColor: '#fff7ed',
                                                border: '1px solid #ffedd5',
                                                padding: '2px 6px',
                                                borderRadius: '12px',
                                            }}>
                                                À réviser
                                            </span>
                                        )}
                                        <div className="browse-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button className="browse-action-btn" onClick={() => onEditCard(card)}><PencilSimple size={16} /></button>
                                            <button className="browse-action-btn" onClick={() => onDeleteCard(card)}><Trash size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <h3 className="browse-card-title">{card.title}</h3>
                                        {card.subtitle && <div className="browse-card-subtitle">{card.subtitle}</div>}
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#64748b',
                                            marginTop: '4px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: '1.5'
                                        }}>
                                            {stripMarkdown(card.content)}
                                        </div>
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
                                    {sortedCards.map(card => (
                                        <tr key={card.id} onClick={() => onCardClick(card.id)}>
                                            <td>
                                                <span
                                                    className="browse-tag"
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        backgroundColor: getCategoryColor(card.type),
                                                        color: '#fff',
                                                        border: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> {card.type}
                                                </span>
                                                {/* Visual Badge for Low Quality */}
                                                {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        color: '#c2410c',
                                                        backgroundColor: '#fff7ed',
                                                        border: '1px solid #ffedd5',
                                                        padding: '2px 6px',
                                                        borderRadius: '12px',
                                                        marginLeft: '6px'
                                                    }}>
                                                        À réviser
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{card.title}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#868e96' }}>{card.subtitle}</td>
                                            <td style={{ color: '#495057', fontSize: '0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {stripMarkdown(card.content)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                                    <button className="browse-action-btn" onClick={() => onEditCard(card)}><PencilSimple size={16} /></button>
                                                    <button className="browse-action-btn" onClick={() => onDeleteCard(card)}><Trash size={16} /></button>
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
