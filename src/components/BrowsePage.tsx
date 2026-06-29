// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    PencilSimple,
    Trash,
    ArrowsDownUp,
    SquaresFour,
    Rows,
    DownloadSimple
} from '@phosphor-icons/react';
import { exportToAnki } from '../utils/ankiExport';
import type { Card } from '../types';
import { COURSE_TYPE } from '../types';
import SearchSynthesis from './SearchSynthesis';
import { useTheme } from '../context/ThemeContext';
import { useCardStore as useCards } from '../store/useCardStore';
import { useUIStore as useUI } from '../store/useUIStore';
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
    isNetworkOnly?: boolean;

    // Network side panel: card shown alongside the network view
    networkPanelCard?: Card | null;
    onNetworkPanelClose?: () => void;
    networkPanelPinned?: boolean;
    onNetworkPanelPinToggle?: () => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
    renderNetworkView,
    isNetworkOnly,
    networkPanelCard,
    onNetworkPanelClose,
    networkPanelPinned,
    onNetworkPanelPinToggle
}) => {
    const { getCategoryColor, getCategoryIcon, darkMode } = useTheme();
    const { cards, setEditingCard, setCardToDelete } = useCards();
    const { searchQuery, activeFilters, setActiveFilters, viewMode, setViewMode, setAddDataMode } = useUI();
    const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);

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
        <div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div className="w-full max-w-[1600px] self-center flex flex-col flex-1 min-h-0 w-full" style={{ overflow: 'hidden' }}>
            {/* Toolbar Filters */}
            <div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '32px 48px 16px 48px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        className={`browse-filter-pill ${activeFilters.length === 0 || activeFilters.includes('all') ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('all')}
                        style={{ margin: 0, border: 'none', background: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-text)' : 'transparent', color: (activeFilters.length === 0 || activeFilters.includes('all')) ? 'var(--color-bg)' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
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
                            style={{ margin: 0, border: 'none', background: isActive ? getCategoryColor(type) : 'transparent', color: isActive ? '#ffffff' : 'var(--color-text-muted)', fontWeight: 600, padding: '6px 16px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {getFilterLabel(type)}
                        </button>
                    )})}
                    {/* special filter for review mode */}
                    {activeFilters.includes('needs-review') && (
                        <button
                            className="browse-filter-pill active"
                            onClick={() => handleFilterToggle('needs-review')}
                            style={{ margin: 0, border: 'none', background: 'var(--color-warning)', color: 'var(--color-surface)', fontWeight: 600, padding: '8px 20px', borderRadius: '12px', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            À réviser
                        </button>
                    )}
                </div>

                <div className="browse-toolbar-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Add Button */}
                    <button
                        onClick={() => setAddDataMode('create')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        + Nouvelle Fiche
                    </button>

                    {/* Sort Options */}
                    {!isNetworkOnly && viewMode !== 'network' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowsDownUp size={16} color="var(--color-text-muted)" />
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={sortOption} 
                                    onChange={(e) => setSortOption(e.target.value)}
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
                    {!isNetworkOnly && (
                        <div className="flex items-center gap-1 rounded-[10px] p-1" style={{ background: darkMode ? '#1A2235' : '#e2e8f0' }}>
                            <button
                                className={`browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'grid' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'grid' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            >
                                <SquaresFour size={16} /> Grille
                            </button>
                            <button
                                className={`browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'list' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'list' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            >
                                <Rows size={16} /> Liste
                            </button>

                            <button
                                className={`browse-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                                onClick={() => setViewMode('split')}
                                style={{ margin: 0, padding: '6px 14px', borderRadius: '6px', border: 'none', background: viewMode === 'split' ? (darkMode ? '#0B1120' : '#ffffff') : 'transparent', color: viewMode === 'split' ? (darkMode ? '#34d399' : '#059669') : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'split' && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            >
                                <SquaresFour size={16} /> Mixte
                            </button>
                        </div>
                    )}
                    
                    {/* Export Anki */}
                    <button
                        onClick={() => exportToAnki('My_Deck', sortedCards).catch(err => console.error("Anki export error:", err))}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-text-muted)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                        title="Exporter ces cartes vers Anki"
                    >
                        <DownloadSimple size={16} weight="bold" />
                        Anki (.apkg)
                    </button>
                </div>
            </div >

            {/* Main Content Area */}
            <main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''} px-10 pt-3 pb-6`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

                {/* Search Synthesis */}
                {searchQuery && (
                    <SearchSynthesis
                        query={searchQuery}
                        matchedCards={sortedCards}
                        allCards={cards}
                        onCardClick={setSynthesisPanelCardId}
                    />
                )}

                <div style={{ display: (viewMode === 'split' && !isNetworkOnly) ? 'flex' : 'block', gap: '2rem', flex: 1, justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
                    
                    {!isNetworkOnly && (
                        <div className="custom-scrollbar" style={{ flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1', overflowY: 'auto', paddingRight: viewMode === 'split' ? '1rem' : '4px', transition: 'all 0.3s ease-in-out', paddingBottom: '2rem', minHeight: 0 }}>

                {(viewMode === 'grid' || viewMode === 'split') && (
                    <div className={`grid gap-6 px-4 py-4 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                        {sortedCards.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            sortedCards.map((card, index) => ( // Index for animation delay if we want embedded styles, but CSS has it generic.
                                <motion.div
                                    layoutId={`card-${card.id}`}
                                    key={card.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ouvrir la carte ${card.title}`}
                                    className={`browse-card ${selectedCardId === card.id ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0B1120]' : ''}`}
                                    onClick={() => setSelectedCardId(card.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedCardId(card.id);
                                        }
                                    }}
                                    // Inline animation delay for first few items
                                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, background: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)' }}
                                >
                                    <div className="browse-card-header">
                                        <span
                                            style={{
                                                backgroundColor: darkMode ? '#0B1120' : '#f1f5f9',
                                                color: getCategoryColor(card.type),
                                                border: 'none',
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
                                        <div className="browse-card-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                                            <button className="browse-action-btn" aria-label={`Modifier ${card.title}`} title="Modifier" onClick={() => { setEditingCard(card); setAddDataMode('edit'); }}><PencilSimple size={16} /></button>
                                            <button className="browse-action-btn" aria-label={`Supprimer ${card.title}`} title="Supprimer" onClick={() => setCardToDelete(card)}><Trash size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: darkMode ? '#f8fafc' : '#0f172a', margin: '8px 0 4px 0' }}>{card.title}</h3>
                                        {card.subtitle && <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: darkMode ? '#94a3b8' : '#64748b' }}>{card.subtitle}</div>}
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: darkMode ? '#cbd5e1' : '#475569',
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
                        <div style={{ backgroundColor: darkMode ? '#0f1420' : '#ffffff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 4px 15px rgba(0, 0, 0, 0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Type</th>
                                        <th style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titre</th>
                                        <th style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sous-titre</th>
                                        <th style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extrait</th>
                                        <th style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCards.map((card, index) => (
                                        <motion.tr 
                                            layoutId={`card-${card.id}`} 
                                            key={card.id} 
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Ouvrir la carte ${card.title}`}
                                            onClick={() => setSelectedCardId(card.id)} 
                                            onDoubleClick={() => setExpandedCardId(card.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedCardId(card.id);
                                                }
                                            }}
                                            style={{ cursor: 'pointer', backgroundColor: selectedCardId === card.id ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: 'background-color 0.2s' }}
                                        >
                                            <td style={{ padding: '16px 24px', borderBottom: index === sortedCards.length - 1 ? 'none' : `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` }}>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        backgroundColor: getCategoryColor(card.type) + '20',
                                                        color: getCategoryColor(card.type),
                                                        border: `1px solid ${getCategoryColor(card.type)}40`,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '4px 10px',
                                                        borderRadius: 8,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    <DynamicIcon name={getCategoryIcon(card.type)} size={14} /> <span>{card.type}</span>
                                                </span>
                                                {/* Visual Badge for Low Quality */}
                                                {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                                                    <span style={{
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        color: '#f87171',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        padding: '2px 8px',
                                                        borderRadius: 8,
                                                        marginLeft: 8,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        À réviser
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: index === sortedCards.length - 1 ? 'none' : `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: 15 }}>
                                                {card.title}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: index === sortedCards.length - 1 ? 'none' : `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, fontFamily: 'monospace', fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b' }}>
                                                {card.subtitle || '-'}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: index === sortedCards.length - 1 ? 'none' : `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, color: darkMode ? '#cbd5e1' : '#475569', fontSize: 14, maxWidth: 300 }}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {stripMarkdown(card.content)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: index === sortedCards.length - 1 ? 'none' : `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingCard(card); setAddDataMode('edit'); }}
                                                        style={{ background: 'transparent', border: 'none', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
                                                        title="Modifier"
                                                        aria-label={`Modifier ${card.title}`}
                                                    >
                                                        <PencilSimple size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setCardToDelete(card); }}
                                                        style={{ background: 'transparent', border: 'none', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
                                                        title="Supprimer"
                                                        aria-label={`Supprimer ${card.title}`}
                                                    >
                                                        <Trash size={18} />
                                                    </button>
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
                    )}

                    {(viewMode === 'split' || viewMode === 'network' || isNetworkOnly) && (
                        <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#111827] relative flex flex-row h-full min-h-0 min-w-0 transition-all duration-300 shadow-sm">
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
            </div>
        </div>
    );
};
