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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.25) }}
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
            className={`group relative flex items-center cursor-pointer transition-colors duration-200 border-b border-slate-100 dark:border-slate-800/60 px-7 py-4 gap-5 ${
                isSelected 
                    ? 'bg-teal-50/50 dark:bg-teal-900/20' 
                    : isActive || isHovered
                        ? 'bg-slate-50 dark:bg-slate-800/50'
                        : 'bg-transparent'
            }`}
        >
            {/* ── Left accent bar ── */}
            <div 
                className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-y-100' : isSelected || isHovered ? 'opacity-50 scale-y-75' : 'opacity-0 scale-y-0'
                }`}
                style={{ backgroundColor: color }} 
            />

            {/* ── Checkbox ── */}
            <div
                className="shrink-0" 
                onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
            >
                <div 
                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${
                        isSelected 
                            ? 'bg-teal-500 border-2 border-teal-500 text-white' 
                            : (isSelectionMode || isHovered)
                                ? 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500'
                                : 'opacity-0 pointer-events-none'
                    }`}
                >
                    {isSelected && (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 12 12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                    )}
                </div>
            </div>

            {/* ── Category icon ── */}
            <div 
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 ease-out shadow-sm"
                style={{
                    background: `${color}15`, 
                    border: `1px solid ${color}30`,
                    transform: isHovered ? 'scale(1.05) translateY(-1px)' : 'scale(1) translateY(0)',
                }}
            >
                <DynamicIcon name={getCategoryIcon(card.type)} size={20} color={color} weight="duotone" />
            </div>

            {/* ── Title + subtitle ── */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div 
                    className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug transition-colors duration-200"
                    style={{ color: (isHovered && !isActive) ? color : undefined }}
                >
                    {card.title}
                </div>
                {card.subtitle && (
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate mt-1">
                        {card.subtitle}
                    </div>
                )}
            </div>

            {/* ── Category badge ── */}
            <div className="hidden sm:block shrink-0 w-[110px]">
                <span 
                    className="inline-flex items-center py-1.5 px-3 rounded-lg text-[11px] font-bold tracking-wider uppercase"
                    style={{ color: color, background: `${color}15` }}
                >
                    {typeLabel}
                </span>
            </div>

            {/* ── Tags ── */}
            <div className="hidden lg:flex shrink-0 w-[200px] gap-1.5 flex-wrap items-center">
                {card.tags && card.tags.length > 0 ? (
                    <>
                        {card.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2 rounded-md max-w-[80px] truncate">
                                {tag}
                            </span>
                        ))}
                        {card.tags.length > 3 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1 px-1">
                                +{card.tags.length - 3}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-xs font-medium text-slate-300 dark:text-slate-700">—</span>
                )}
            </div>

            {/* ── Actions (React state hover — reliable) ── */}
            <div 
                className={`shrink-0 flex items-center gap-1.5 w-[76px] justify-end transition-opacity duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {/* Edit */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(card); }}
                    title="Modifier"
                    className="w-[34px] h-[34px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm hover:bg-teal-600 hover:border-teal-600 hover:text-white dark:hover:bg-teal-500 dark:hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5"
                >
                    <PencilSimple size={16} weight="bold" />
                </button>

                {/* Delete */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(card, e); }}
                    title="Supprimer"
                    className="w-[34px] h-[34px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:border-red-900/50 dark:hover:text-red-400 hover:shadow-md hover:-translate-y-0.5"
                >
                    <Trash size={16} weight="bold" />
                </button>
            </div>
        </motion.div>
    );
});
