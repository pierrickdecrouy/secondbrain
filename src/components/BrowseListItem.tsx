import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';
import type { Card } from '../types';
import { PencilSimple, Trash } from '@phosphor-icons/react';

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
    onEdit?: (card: Card) => void;
    onDelete?: (card: Card, e: React.MouseEvent) => void;
}

const TYPE_LABELS: Record<string, string> = {
    PATHO: 'Pathologie',
    DRUG: 'Médicament',
    DATA: 'Donnée',
    PHYSIO: 'Physiologie',
    FLASHCARD: 'Flashcard',
    CONCEPT: 'Concept',
};

export const BrowseListItem: React.FC<BrowseListItemProps> = React.memo(({
    card,
    index,
    selectedCardId,
    isSelectionMode,
    isSelected,
    getCategoryColor,
    getCategoryIcon,
    onSelect,
    onDoubleSelect,
    onToggleSelect,
    onEdit,
    onDelete,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const isActive = selectedCardId === card.id;
    const color = getCategoryColor(card.type);
    const typeLabel = TYPE_LABELS[card.type?.toUpperCase()] ?? card.type;

    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode) onToggleSelect(card.id, e);
        else onSelect(card.id);
    };

    const bg = isSelected
        ? `color-mix(in srgb, ${color} 7%, var(--color-surface))`
        : isActive || isHovered
            ? 'var(--color-surface-hover)'
            : 'transparent';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, delay: Math.min(index * 0.018, 0.25) }}
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir ${card.title}`}
            aria-pressed={isSelected}
            onClick={handleClick}
            onDoubleClick={() => !isSelectionMode && onDoubleSelect(card.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e as any); }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '16px 28px',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                background: bg,
                borderBottom: '1px solid var(--color-border)',
            }}
        >
            {/* ── Left accent bar ── */}
            <div style={{
                position: 'absolute', left: 0, top: '10px', bottom: '10px',
                width: '3px', borderRadius: '0 3px 3px 0',
                backgroundColor: color,
                opacity: isHovered || isSelected || isActive ? 1 : 0,
                transition: 'opacity 0.12s ease',
            }} />

            {/* ── Checkbox ── */}
            <div
                style={{ flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
            >
                <div style={{
                    width: '18px', height: '18px', borderRadius: '6px',
                    border: isSelected ? 'none' : '1.5px solid var(--color-border)',
                    background: isSelected ? color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.12s ease', flexShrink: 0,
                    boxShadow: isSelected ? `0 2px 8px ${color}40` : 'none',
                }}>
                    {isSelected && (
                        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 12 12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                    )}
                </div>
            </div>

            {/* ── Category icon ── */}
            <div style={{
                flexShrink: 0, width: '38px', height: '38px', borderRadius: '12px',
                background: `${color}12`, border: `1px solid ${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.12s ease',
                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            }}>
                <DynamicIcon name={getCategoryIcon(card.type)} size={16} color={color} />
            </div>

            {/* ── Title + subtitle ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '14px', fontWeight: 600,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    lineHeight: 1.4,
                }}>
                    {card.title}
                </div>
                {card.subtitle && (
                    <div style={{
                        fontSize: '12px', fontWeight: 400,
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginTop: '2px', lineHeight: 1.3,
                    }}>
                        {card.subtitle}
                    </div>
                )}
            </div>

            {/* ── Category badge ── */}
            <div className="hidden sm:block" style={{ flexShrink: 0, width: '110px' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '4px 10px', borderRadius: '8px',
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em',
                    color: color, background: `${color}12`,
                }}>
                    {typeLabel}
                </span>
            </div>

            {/* ── Tags ── */}
            <div className="hidden lg:flex" style={{
                flexShrink: 0, width: '200px',
                display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center',
            }}>
                {card.tags && card.tags.length > 0 ? (
                    <>
                        {card.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{
                                fontSize: '11px', fontWeight: 500,
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-surface-hover)',
                                padding: '3px 8px', borderRadius: '6px',
                                maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {tag}
                            </span>
                        ))}
                        {card.tags.length > 3 && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                +{card.tags.length - 3}
                            </span>
                        )}
                    </>
                ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-border)' }}>—</span>
                )}
            </div>

            {/* ── Actions (React state hover — reliable) ── */}
            <div style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '4px',
                width: '68px', justifyContent: 'flex-end',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.12s ease',
            }}>
                {/* Edit */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(card); }}
                    title="Modifier"
                    style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.12s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'var(--color-primary)';
                        el.style.borderColor = 'var(--color-primary)';
                        el.style.color = '#fff';
                        el.style.boxShadow = `0 4px 12px rgba(13,148,136,0.3)`;
                    }}
                    onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'var(--color-surface)';
                        el.style.borderColor = 'var(--color-border)';
                        el.style.color = 'var(--color-text-muted)';
                        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    }}
                >
                    <PencilSimple size={13} weight="bold" />
                </button>

                {/* Delete */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(card, e); }}
                    title="Supprimer"
                    style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.12s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = '#fef2f2';
                        el.style.borderColor = '#fecaca';
                        el.style.color = '#ef4444';
                        el.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)';
                    }}
                    onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'var(--color-surface)';
                        el.style.borderColor = 'var(--color-border)';
                        el.style.color = 'var(--color-text-muted)';
                        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    }}
                >
                    <Trash size={13} weight="bold" />
                </button>
            </div>
        </motion.div>
    );
});
