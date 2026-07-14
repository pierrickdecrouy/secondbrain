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
            className={`glass-panel browse-card transition-all duration-200 h-full ${selectedCardId === card.id && !isSelectionMode ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0B1120]' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e as any);
                }
            }}
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
                    className="uppercase text-[0.6rem] font-extrabold tracking-[0.05em] flex items-center gap-1 py-[3px] px-[7px] rounded-md shrink-0 border-none"
                    style={{
                        backgroundColor: darkMode ? '#0B1120' : '#f1f5f9',
                        color: getCategoryColor(card.type),
                    }}
                >
                    <DynamicIcon name={getCategoryIcon(card.type)} size={11} /> <span>{card.type}</span>
                </span>

                {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                    <span className="text-[0.6rem] text-red-500 bg-red-500/10 py-[2px] px-[5px] rounded font-semibold shrink-0">À revoir</span>
                )}

                {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                    <span className="text-[0.6rem] text-yellow-500 bg-yellow-500/10 py-[2px] px-[5px] rounded font-semibold shrink-0">Leech</span>
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

            <div className="browse-card-body flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-[6px] text-[color:var(--color-text)] leading-tight transition-colors duration-200 hover:text-[color:var(--color-primary)]">
                    {card.title}
                </h3>
                {card.subtitle && (
                    <div className="text-xs text-[color:var(--color-text-muted)] mb-3 font-semibold uppercase tracking-[0.05em]">
                        {card.subtitle}
                    </div>
                )}
                <div className="text-sm text-[color:var(--color-text-muted)] line-clamp-3 overflow-hidden leading-[1.5] flex-1">
                    {(card.details || '').split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                            return <strong key={index} className="font-semibold text-[color:var(--color-text)]">{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
                        }
                        return <span key={index}>{part}</span>;
                    })}
                </div>
            </div>

            <div className="browse-card-footer flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor: darkMode ? '#1e293b' : '#f1f5f9' }}>
                <div className="flex gap-[6px] flex-wrap">
                    {card.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors ${darkMode ? 'text-[#94a3b8] bg-[#1e293b] hover:bg-[#334155]' : 'text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0]'}`}>
                            #{tag}
                        </span>
                    ))}
                    {(card.tags?.length || 0) > 3 && (
                        <span className="text-xs text-[color:var(--color-text-muted)] font-medium px-1.5 py-0.5">+{(card.tags?.length || 0) - 3}</span>
                    )}
                </div>
                <ArrowRight size={12} color="var(--color-text-muted)" className="opacity-50 shrink-0" />
            </div>
        </motion.div>
    );
});
