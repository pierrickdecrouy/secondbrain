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
            className="relative flex items-center gap-5 py-4 px-7 cursor-pointer transition-colors duration-100 border-b border-[color:var(--color-border)]"
            style={{ background: bg }}
        >
            {/* ── Left accent bar ── */}
            <div 
                className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-sm transition-opacity duration-150 ease-out"
                style={{
                    backgroundColor: color,
                    opacity: isHovered || isSelected || isActive ? 1 : 0,
                }} 
            />

            {/* ── Checkbox ── */}
            <div
                style={{ flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
            >
                <div 
                    className="w-[18px] h-[18px] rounded-md flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0"
                    style={{
                        border: isSelected ? 'none' : '1.5px solid var(--color-border)',
                        background: isSelected ? color : 'transparent',
                        boxShadow: isSelected ? `0 2px 8px ${color}40` : 'none',
                    }}
                >
                    {isSelected && (
                        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 12 12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                    )}
                </div>
            </div>

            {/* ── Category icon ── */}
            <div 
                className="shrink-0 w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-transform duration-150 ease-out"
                style={{
                    background: `${color}12`, border: `1px solid ${color}22`,
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                }}
            >
                <DynamicIcon name={getCategoryIcon(card.type)} size={16} color={color} />
            </div>

            {/* ── Title + subtitle ── */}
            <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[color:var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.4]">
                    {card.title}
                </div>
                {card.subtitle && (
                    <div className="text-[12px] font-normal text-[color:var(--color-text-muted)] whitespace-nowrap overflow-hidden text-ellipsis mt-[2px] leading-[1.3]">
                        {card.subtitle}
                    </div>
                )}
            </div>

            {/* ── Category badge ── */}
            <div className="hidden sm:block shrink-0 w-[110px]">
                <span 
                    className="inline-flex items-center py-1 px-2.5 rounded-lg text-[11px] font-semibold tracking-[0.03em]"
                    style={{ color: color, background: `${color}12` }}
                >
                    {typeLabel}
                </span>
            </div>

            {/* ── Tags ── */}
            <div className="hidden lg:flex shrink-0 w-[200px] gap-[5px] flex-wrap items-center">
                {card.tags && card.tags.length > 0 ? (
                    <>
                        {card.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[11px] font-medium text-[color:var(--color-text-muted)] bg-[color:var(--color-surface-hover)] py-[3px] px-2 rounded-md max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                        {card.tags.length > 3 && (
                            <span className="text-[11px] text-[color:var(--color-text-muted)] font-medium">
                                +{card.tags.length - 3}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-[12px] text-[color:var(--color-border)]">—</span>
                )}
            </div>

            {/* ── Actions (React state hover — reliable) ── */}
            <div 
                className="shrink-0 flex items-center gap-1 w-[68px] justify-end transition-opacity duration-150 ease-out"
                style={{ opacity: isHovered ? 1 : 0 }}
            >
                {/* Edit */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(card); }}
                    title="Modifier"
                    className="w-[32px] h-[32px] rounded-[9px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] hover:text-white hover:shadow-[0_4px_12px_rgba(13,148,136,0.3)]"
                >
                    <PencilSimple size={13} weight="bold" />
                </button>

                {/* Delete */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(card, e); }}
                    title="Supprimer"
                    className="w-[32px] h-[32px] rounded-[9px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-[#fef2f2] hover:border-[#fecaca] hover:text-[#ef4444] hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
                >
                    <Trash size={13} weight="bold" />
                </button>
            </div>
        </motion.div>
    );
});
