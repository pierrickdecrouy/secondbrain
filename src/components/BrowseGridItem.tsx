import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';
import type { Card } from '../types';
import { ArrowRight, Check } from '@phosphor-icons/react';

interface BrowseGridItemProps {
    card: Card;
    index: number;
    selectedCardId: string | null;
    isSelectionMode: boolean;
    isSelected: boolean;
    darkMode: boolean;
    getCategoryColor: (type: string) => string;
    getCategoryIcon: (type: string) => string;
    calculateQualityScore: (card: Card, connectionsCount: number) => { score: number };
    activeFilters: string[];
    onSelect: (id: string) => void;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const BrowseGridItem: React.FC<BrowseGridItemProps> = React.memo(({
    card,
    selectedCardId,
    isSelectionMode,
    isSelected,
    darkMode,
    getCategoryColor,
    getCategoryIcon,
    calculateQualityScore,
    activeFilters,
    onSelect,
    onToggleSelect,
    onDelete
}) => {
    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            onToggleSelect(card.id, e);
        } else {
            onSelect(card.id);
        }
    };

    return (
        <motion.div
            layoutId={`card-${card.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir la carte ${card.title}`}
            aria-pressed={isSelected}
            className={`glass-panel browse-card ${selectedCardId === card.id && !isSelectionMode ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0B1120]' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e as any);
                }
            }}
            style={{ transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}
        >
            {/* Checkbox multi-sélection */}
            <div
                className={`browse-card-checkbox ${isSelectionMode ? 'is-visible' : ''} ${isSelected ? 'is-checked' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Sélectionner ${card.title}`}
            >
                {isSelected && <Check size={11} weight="bold" color="white" />}
            </div>

            <div className="browse-card-header">
                <span
                    style={{
                        backgroundColor: darkMode ? '#0B1120' : '#f1f5f9',
                        color: getCategoryColor(card.type),
                        border: 'none',
                        textTransform: 'uppercase',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 7px',
                        borderRadius: '6px',
                        flexShrink: 0,
                    }}
                >
                    <DynamicIcon name={getCategoryIcon(card.type)} size={11} /> <span>{card.type}</span>
                </span>

                {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                    <span style={{ fontSize: '0.6rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 5px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>À revoir</span>
                )}

                {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                    <span style={{ fontSize: '0.6rem', color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: '2px 5px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>Leech</span>
                )}

                {onDelete && !isSelectionMode && (
                    <button
                        onClick={(e) => onDelete(card.id, e)}
                        className="browse-card-delete"
                        aria-label="Supprimer la carte"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                )}
            </div>

            <div className="browse-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', lineHeight: 1.25, transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text)'}
                >
                    {card.title}
                </h3>
                {card.subtitle && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {card.subtitle}
                    </div>
                )}
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, flex: 1 }}>
                    {(card.details || '').split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                            return <strong key={index} style={{ fontWeight: 600, color: 'var(--color-text)' }}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                            return <em key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
                        }
                        return <span key={index}>{part}</span>;
                    })}
                </div>
            </div>

            <div className="browse-card-footer" style={{ borderTop: `1px solid ${darkMode ? '#1e293b' : '#f1f5f9'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {card.tags?.slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: '0.75rem', color: darkMode ? '#94a3b8' : '#64748b', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 500, transition: 'background-color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#e2e8f0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1e293b' : '#f1f5f9'}
                        >
                            #{tag}
                        </span>
                    ))}
                    {(card.tags?.length || 0) > 3 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, padding: '2px 6px' }}>+{(card.tags?.length || 0) - 3}</span>
                    )}
                </div>
                <ArrowRight size={12} color="var(--color-text-muted)" style={{ opacity: 0.5, flexShrink: 0 }} />
            </div>
        </motion.div>
    );
});
