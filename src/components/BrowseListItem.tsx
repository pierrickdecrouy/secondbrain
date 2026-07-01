import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';
import type { Card } from '../types';
import { stripMarkdown } from '../utils';
import { Trash, PencilSimple, Check } from '@phosphor-icons/react';

interface BrowseListItemProps {
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
    onDoubleSelect: (id: string) => void;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onEdit?: (id: string, e: React.MouseEvent) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const BrowseListItem: React.FC<BrowseListItemProps> = React.memo(({
    card,
    selectedCardId,
    isSelectionMode,
    isSelected,
    getCategoryColor,
    getCategoryIcon,
    calculateQualityScore,
    activeFilters,
    onSelect,
    onDoubleSelect,
    onToggleSelect,
    onEdit,
    onDelete
}) => {
    const isActive = selectedCardId === card.id;

    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            onToggleSelect(card.id, e);
        } else {
            onSelect(card.id);
        }
    };

    return (
        <td colSpan={5} style={{ padding: 0, margin: 0 }}>
            <motion.div
                layoutId={`card-${card.id}`}
                role="button"
                tabIndex={0}
                aria-label={`Ouvrir la carte ${card.title}`}
                aria-pressed={isSelected}
                onClick={handleClick}
                onDoubleClick={() => !isSelectionMode && onDoubleSelect(card.id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(e as any);
                    }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                        ? 'rgba(5, 150, 105, 0.08)'
                        : isActive
                            ? 'var(--color-success-bg)'
                            : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--color-success)' : '3px solid transparent',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    padding: '10px 20px',
                    borderBottom: `1px solid var(--color-border)`,
                    gap: '12px',
                }}
                onMouseEnter={e => {
                    if (!isActive && !isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }
                }}
                onMouseLeave={e => {
                    if (!isActive && !isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }}
                className="browse-list-row"
            >
                {/* Checkbox */}
                <div
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
                    style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${isSelected ? 'var(--color-success)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-success)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, cursor: 'pointer',
                        transition: 'opacity 0.15s, background 0.15s',
                    }}
                    className={`list-item-checkbox ${isSelectionMode ? 'is-visible' : ''}`}
                >
                    {isSelected && <Check size={11} weight="bold" color="white" />}
                </div>

                {/* Type badge */}
                <div style={{ width: '96px', flexShrink: 0 }}>
                    <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: getCategoryColor(card.type) + '18',
                        color: getCategoryColor(card.type),
                        border: `1px solid ${getCategoryColor(card.type)}30`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> <span>{card.type}</span>
                    </span>
                    {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                        <div style={{ marginTop: '4px', fontSize: '9px', color: '#ef4444', fontWeight: 700 }}>À REVOIR</div>
                    )}
                    {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                        <div style={{ marginTop: '4px', fontSize: '9px', color: '#eab308', fontWeight: 700 }}>LEECH</div>
                    )}
                </div>

                {/* Titre */}
                <div style={{ flex: '0 0 220px', paddingRight: '12px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {card.title}
                    </div>
                    {card.subtitle && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {card.subtitle}
                        </div>
                    )}
                </div>

                {/* Extrait */}
                <div style={{ flex: 1, paddingRight: '12px', minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stripMarkdown(card.details || card.content || '')}
                    </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {card.tags?.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-hover)', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>#{tag}</span>
                    ))}
                </div>

                {/* Actions */}
                {!isSelectionMode && (
                    <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(card.id, e); }}
                                className="browse-action-btn list-action-btn"
                                aria-label={`Modifier ${card.title}`}
                                title="Modifier"
                            >
                                <PencilSimple size={15} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(card.id, e); }}
                                className="browse-action-btn list-action-btn list-action-btn-danger"
                                aria-label="Supprimer la carte"
                                title="Supprimer"
                            >
                                <Trash size={15} />
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </td>
    );
});
