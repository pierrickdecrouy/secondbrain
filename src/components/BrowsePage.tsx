// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { useCards } from '../context/CardContext';
import { useUI } from '../context/UIContext';
import { useFilteredCards } from '../hooks/useFilteredCards';
import { stripMarkdown } from '../utils';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { DynamicIcon } from './DynamicIcon';
import { CardSidePanel } from './CardSidePanel';
import { DetailModal } from './DetailModal';

// Type for ViewMode


type SortOption = 'name-asc' | 'name-desc' | 'type' | 'date-created-desc' | 'date-created-asc' | 'date-modified-desc';

interface BrowsePageProps {
    // Optional: Render prop for Network View to reuse existing component
    renderNetworkView?: (activeNodeId: string | null) => React.ReactNode;

    // Network side panel: card shown alongside the network view
    networkPanelCard?: Card | null;
    onNetworkPanelClose?: () => void;
    networkPanelPinned?: boolean;
    onNetworkPanelPinToggle?: () => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
    renderNetworkView,
    networkPanelCard,
    onNetworkPanelClose,
    networkPanelPinned,
    onNetworkPanelPinToggle
}) => {
        const { getCategoryColor, getCategoryIcon } = useTheme();
    const { cards, setEditingCard, setCardToDelete } = useCards();
    const { searchQuery, activeFilters, setActiveFilters, viewMode, setViewMode, setAddDataMode } = useUI();
    const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);

    useEffect(() => {
        if (viewMode === 'network') {
            setViewMode('grid');
        }
    }, [viewMode, setViewMode]);

    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [panelWidth, setPanelWidth] = useState(460);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [synthesisPanelCardId, setSynthesisPanelCardId] = useState<string | null>(null);

    const selectedCard = useMemo(() => {
        if (!selectedCardId) return null;
        return cards.find(c => c.id === selectedCardId) || null;
    }, [cards, selectedCardId]);

    const selectedIndex = filteredCards.findIndex(c => c.id === selectedCardId);
    const handleNextCard = () => {
        if (selectedIndex >= 0 && selectedIndex < filteredCards.length - 1) {
            setSelectedCardId(filteredCards[selectedIndex + 1].id);
        }
    };
    const handlePrevCard = () => {
        if (selectedIndex > 0) {
            setSelectedCardId(filteredCards[selectedIndex - 1].id);
        }
    };

    const synthesisIndex = filteredCards.findIndex(c => c.id === synthesisPanelCardId);
    const handleNextSynthesis = () => {
        if (synthesisIndex >= 0 && synthesisIndex < filteredCards.length - 1) {
            setSynthesisPanelCardId(filteredCards[synthesisIndex + 1].id);
        }
    };
    const handlePrevSynthesis = () => {
        if (synthesisIndex > 0) {
            setSynthesisPanelCardId(filteredCards[synthesisIndex - 1].id);
        }
    };
    const synthesisPanelCard = useMemo(() => {
        if (!synthesisPanelCardId) return null;
        return cards.find(c => c.id === synthesisPanelCardId) || null;
    }, [cards, synthesisPanelCardId]);
    

    const handleFilterToggle = (type: string) => {
        setActiveFilters(type === 'all' ? [] : 
            activeFilters.includes(type) ? activeFilters.filter(t => t !== type) : [...activeFilters, type]
        );
        setSelectedCardId(null);
    };

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
    }, [filteredCards, sortOption]);

    return (
        <div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
            {/* Toolbar Filters */}
            <div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '16px 32px 0 32px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('all')}
                        style={{ margin: 0, border: 'none', background: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-drug)' : 'transparent', color: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-surface)' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Tous
                    </button>
                    {Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort().map(type => {
                        const isActive = activeFilters.includes(type);
                        return (
                        <button
                            key={type}
                            className={`browse-filter-pill ${isActive ? 'active' : ''}`}
                            onClick={() => handleFilterToggle(type)}
                            style={{ margin: 0, border: 'none', background: isActive ? getCategoryColor(type) : 'transparent', color: isActive ? 'var(--color-surface)' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )})}
                    {/* special filter for review mode */}
                    {activeFilters.includes('needs-review') && (
                        <button
                            className="browse-filter-pill active"
                            onClick={() => handleFilterToggle('needs-review')}
                            style={{ margin: 0, border: 'none', backgroundColor: 'var(--color-warning)', color: 'var(--color-surface)', fontWeight: 600, padding: '6px 16px', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            À réviser
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                    {/* Sort Dropdown */}
                    {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="browse-view-toggle" style={{ padding: '4px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <ArrowsDownUp size={16} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    style={{
                                        appearance: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '6px 12px 6px 32px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontFamily: 'inherit'
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
                    {true && (
                        <div className="browse-view-toggle" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
                            <button
                                className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'grid' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <SquaresFour size={18} /> Grille
                            </button>
                            <button
                                className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'list' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'list' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <Rows size={18} /> Liste
                            </button>

                            <button
                                className={`browse-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                                onClick={() => setViewMode('split')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'split' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'split' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <SquaresFour size={18} /> Mixte
                            </button>

                        </div>
                    )}
                </div>
            </div >

            {/* Main Content Area */}
            <main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                {/* Search Synthesis */}
                {searchQuery && (
                    <SearchSynthesis
                        query={searchQuery}
                        matchedCards={sortedCards}
                        allCards={cards}
                        onCardClick={setSynthesisPanelCardId}
                    />
                )}

                
                <div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', flex: 1, height: '100%', justifyContent: 'center', minHeight: 0 }}>
                    <div style={{ flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1', overflowY: 'auto', paddingRight: viewMode === 'split' ? '1rem' : '4px', transition: 'all 0.3s ease-in-out', height: '100%', paddingBottom: '2rem', minWidth: 0 }}>

                {(viewMode === 'grid' || viewMode === 'split') && (
                    <div className="browse-card-grid">
                        {sortedCards.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            sortedCards.map((card, index) => ( // Index for animation delay if we want embedded styles, but CSS has it generic.
                                <motion.div
                                    layoutId={`card-${card.id}`}
                                    key={card.id}
                                    className="browse-card"
                                    onClick={() => setSelectedCardId(card.id)}
                                    // Inline animation delay for first few items
                                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                >
                                    <div className="browse-card-header">
                                        <span
                                            style={{
                                                backgroundColor: card.type === 'drug' ? 'var(--color-success-bg)' : card.type === 'pathology' ? 'var(--color-danger-bg)' : 'var(--color-bg)',
                                                color: card.type === 'drug' ? 'var(--color-success)' : card.type === 'pathology' ? 'var(--color-danger)' : 'var(--color-text)',
                                                border: `1px solid ${card.type === 'drug' ? 'var(--color-success-bg)' : card.type === 'pathology' ? 'var(--color-danger-bg)' : 'var(--color-border)'}`,
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
                                            <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> <span>{card.type}</span>
                                        </span>
                                        {/* Visual Badge for Low Quality (Only in Review Mode) */}
                                        {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                color: '#c2410c',
                                                backgroundColor: 'var(--color-warning-bg)',
                                                border: '1px solid #ffedd5',
                                                padding: '2px 6px',
                                                borderRadius: '12px',
                                            }}>
                                                À réviser
                                            </span>
                                        )}
                                        <div className="browse-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button className="browse-action-btn" onClick={() => { setEditingCard(card); setAddDataMode('edit'); }}><PencilSimple size={16} /></button>
                                            <button className="browse-action-btn" onClick={() => setCardToDelete(card)}><Trash size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <h3 className="browse-card-title">{card.title}</h3>
                                        {card.subtitle && <div className="browse-card-subtitle">{card.subtitle}</div>}
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--color-text-muted)',
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
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {
                    viewMode === 'list' && (
                        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
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
                                        <motion.tr layoutId={`card-${card.id}`} key={card.id} onClick={() => setSelectedCardId(card.id)} onDoubleClick={() => setExpandedCardId(card.id)}>
                                            <td>
                                                <span
                                                    className="browse-tag"
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        backgroundColor: getCategoryColor(card.type),
                                                        color: 'var(--color-surface)',
                                                        border: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> <span>{card.type}</span>
                                                </span>
                                                {/* Visual Badge for Low Quality */}
                                                {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        color: '#c2410c',
                                                        backgroundColor: 'var(--color-warning-bg)',
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
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{card.subtitle}</td>
                                            <td style={{ color: 'var(--color-text)', fontSize: '0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {stripMarkdown(card.content)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                                    <button className="browse-action-btn" onClick={(e) => { e.stopPropagation(); setEditingCard(card); setAddDataMode('edit'); }}><PencilSimple size={16} /></button>
                                                    <button className="browse-action-btn" onClick={(e) => { e.stopPropagation(); setCardToDelete(card); }}><Trash size={16} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                    </div>
                    {(viewMode === 'split' || viewMode === 'network') && (
                        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative', display: 'flex', flexDirection: 'row', height: '100%', minHeight: 0, minWidth: 0 }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
                                {renderNetworkView && renderNetworkView(selectedCardId)}
                            </div>
                        </div>
                    )}
                </div>

            </main>

            {selectedCard && (viewMode !== 'split' || expandedCardId === selectedCard.id) && (
                <DetailModal
                    key={`modal-${selectedCard.id}`}
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => {
                        setExpandedCardId(null);
                        if (viewMode !== 'split') {
                            setSelectedCardId(null);
                        }
                    }}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    onNext={handleNextCard}
                    onPrev={handlePrevCard}
                    actions={
                        <div className="modal-actions">
                            <button className="btn-icon" onClick={() => { setEditingCard(selectedCard); setAddDataMode('edit'); }} title="Modifier">
                                <PencilSimple size={18} />
                            </button>
                            <button className="btn-icon" onClick={() => setCardToDelete(selectedCard)} title="Supprimer">
                                <Trash size={18} />
                            </button>
                        </div>
                    }
                />
            )}



        
            {synthesisPanelCard && expandedCardId !== synthesisPanelCard.id && (
                <div key={`synthesis-container-${synthesisPanelCard.id}`} style={{
                    position: viewMode === 'split' ? 'absolute' : 'fixed',
                    top: 16, 
                    right: 16, 
                    bottom: 16, 
                    height: 'calc(100% - 32px)',
                    width: viewMode === 'split' ? 'calc(50% - 32px)' : '500px',
                    maxWidth: '100vw',
                    backgroundColor: 'var(--color-surface)',
                    zIndex: 1000,
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: 'var(--shadow-2xl)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <CardSidePanel
                        key={`synthesis-${synthesisPanelCard.id}`}
                        card={synthesisPanelCard}
                        allCards={cards}
                        onClose={() => setSynthesisPanelCardId(null)}
                        onPinToggle={() => {}}
                        pinned={false}
                        onExpand={() => setExpandedCardId(synthesisPanelCard.id)}
                        onLinkClick={(id) => {
                            setSynthesisPanelCardId(id);
                        }}
                    />
                    <style>
                        {`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                        `}
                    </style>
                </div>
            )}
    </div >
    );
};
