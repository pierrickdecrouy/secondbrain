import React, { useState, useMemo } from 'react';
import {
    PencilSimple,
    Trash,
    ArrowsDownUp,
    SquaresFour,
    Rows
} from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE } from '../types';
import './BrowsePage.css';
import SearchSynthesis from './SearchSynthesis';
import { useTheme } from '../context/ThemeContext';
import { stripMarkdown } from '../utils';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { DynamicIcon } from './DynamicIcon';
import { CardSidePanel } from './CardSidePanel';

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

    // Network side panel: card shown alongside the network view
    networkPanelCard?: Card | null;
    onNetworkPanelClose?: () => void;
    networkPanelPinned?: boolean;
    onNetworkPanelPinToggle?: () => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
    cards,
    searchQuery,
    activeFilters,
    onFilterToggle,
    onCardClick,
    onEditCard,
    onDeleteCard,
    viewMode,
    onViewModeChange,
    renderNetworkView,
    networkPanelCard,
    onNetworkPanelClose,
    networkPanelPinned,
    onNetworkPanelPinToggle
}) => {
    const { getCategoryColor, getCategoryIcon } = useTheme();
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [panelWidth, setPanelWidth] = useState(460);

    const handleMouseDownResizer = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = panelWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = startX - moveEvent.clientX;
            setPanelWidth(Math.max(300, Math.min(startWidth + delta, window.innerWidth - 200)));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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

    const sortedCards = useMemo(() => {
        const sorted = [...cards];
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
            {/* Toolbar Filters */}
            <div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', paddingLeft: 0 }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                        onClick={() => onFilterToggle('all')}
                        style={{ margin: 0, border: 'none', background: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-drug)' : 'transparent', color: (activeFilters.length === 0 || activeFilters.includes('all')) ? '#fff' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Tous
                    </button>
                    {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                        const isActive = activeFilters.includes(type);
                        return (
                        <button
                            key={type}
                            className={`browse-filter-pill ${isActive ? 'active' : ''}`}
                            onClick={() => onFilterToggle(type)}
                            style={{ margin: 0, border: 'none', background: isActive ? getCategoryColor(type) : 'transparent', color: isActive ? '#fff' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )})}
                    {/* special filter for review mode */}
                    {activeFilters.includes('needs-review') && (
                        <button
                            className="browse-filter-pill active"
                            onClick={() => onFilterToggle('needs-review')}
                            style={{ margin: 0, border: 'none', backgroundColor: '#f97316', color: '#fff', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            À réviser
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                    {/* Sort Dropdown */}
                    {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="browse-view-toggle" style={{ padding: '6px' }}>
                            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <ArrowsDownUp size={16} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    style={{
                                        appearance: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '4px 12px 4px 32px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text)',
                                        fontWeight: 600,
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
                    {viewMode !== 'network' && (
                        <div className="browse-view-toggle" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
                            <button
                                className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => onViewModeChange('grid')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'grid' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <SquaresFour size={18} /> Grille
                            </button>
                            <button
                                className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => onViewModeChange('list')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'list' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'list' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <Rows size={18} /> Liste
                            </button>
                        </div>
                    )}
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
                                            style={{
                                                backgroundColor: card.type === 'drug' ? '#ecfdf5' : card.type === 'pathology' ? '#fff1f2' : '#eff6ff',
                                                color: card.type === 'drug' ? '#047857' : card.type === 'pathology' ? '#be123c' : '#1d4ed8',
                                                border: `1px solid ${card.type === 'drug' ? '#d1fae5' : card.type === 'pathology' ? '#ffe4e6' : '#dbeafe'}`,
                                                textTransform: 'uppercase',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> {card.type}
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
                        <div 
                            className={`browse-network-layout ${networkPanelCard ? 'has-panel' : ''}`}
                            style={networkPanelCard && window.innerWidth > 650 ? { gridTemplateColumns: `minmax(0, 1fr) ${panelWidth}px` } : {}}
                        >
                            <div className="browse-network-container">
                                {renderNetworkView && renderNetworkView()}
                            </div>
                            {networkPanelCard && (
                                <>
                                    <div 
                                        className="network-panel-resizer hidden md:block" 
                                        onMouseDown={handleMouseDownResizer}
                                        style={{
                                            position: 'absolute',
                                            right: `${panelWidth - 3}px`,
                                            top: 0,
                                            bottom: 0,
                                            width: '6px',
                                            cursor: 'col-resize',
                                            zIndex: 60,
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                    <CardSidePanel
                                        card={networkPanelCard}
                                        allCards={cards}
                                        onClose={() => onNetworkPanelClose?.()}
                                        onPinToggle={() => onNetworkPanelPinToggle?.()}
                                        pinned={Boolean(networkPanelPinned)}
                                        onLinkClick={onCardClick}
                                        onPrev={(() => {
                                            const idx = sortedCards.findIndex(c => c.id === networkPanelCard.id);
                                            if (idx > 0) return () => onCardClick(sortedCards[idx - 1].id);
                                            return undefined;
                                        })()}
                                        onNext={(() => {
                                            const idx = sortedCards.findIndex(c => c.id === networkPanelCard.id);
                                            if (idx >= 0 && idx < sortedCards.length - 1) return () => onCardClick(sortedCards[idx + 1].id);
                                            return undefined;
                                        })()}
                                    />
                                </>
                            )}
                        </div>
                    )
                }

            </main >
        </div >
    );
};
