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
            className={`group relative bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-[20px] p-6 flex flex-col transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 h-full cursor-pointer overflow-hidden ${
                selectedCardId === card.id && !isSelectionMode ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#fafafa] dark:ring-offset-[#09090b]' : ''
            } ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' : ''}`}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e as any);
                }
            }}
        >
            {/* Subtle Gradient background on hover */}
            <div 
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none opacity-0 group-hover:opacity-100" 
                style={{
                    background: `linear-gradient(to bottom right, ${getCategoryColor(card.type)}00, ${getCategoryColor(card.type)}${darkMode ? '15' : '10'})`
                }}
            />

            {/* Checkbox multi-sélection */}
            {isSelectionMode && (
                <div
                    className={`absolute top-4 left-4 z-10 w-5 h-5 rounded border ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 flex items-center justify-center' : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-600 backdrop-blur-sm'
                    } transition-colors cursor-pointer`}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Sélectionner ${card.title}`}
                >
                    {isSelected && <Check size={12} weight="bold" color="white" />}
                </div>
            )}

            <div className={`flex items-start justify-between mb-4 gap-2 flex-wrap relative z-10 ${isSelectionMode ? 'pl-8' : ''}`}>
                <span
                    className="uppercase text-[10px] font-bold tracking-wider flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-current/10"
                    style={{
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        color: getCategoryColor(card.type),
                    }}
                >
                    <DynamicIcon name={getCategoryIcon(card.type)} size={12} /> <span>{card.type}</span>
                </span>

                <div className="flex gap-1.5">
                    {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-1 px-2 rounded-lg font-bold uppercase tracking-wider shrink-0 border border-red-200 dark:border-red-500/20">À revoir</span>
                    )}

                    {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                        <span className="text-[10px] text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 py-1 px-2 rounded-lg font-bold uppercase tracking-wider shrink-0 border border-yellow-200 dark:border-yellow-500/20">Leech</span>
                    )}

                    {onDelete && !isSelectionMode && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(card.id, e); }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Supprimer la carte"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative z-10">
                <style>
                    {`
                    #card-${card.id}:hover .dynamic-title-hover {
                        color: ${getCategoryColor(card.type)} !important;
                    }
                    `}
                </style>
                <h3 className="dynamic-title-hover text-[17px] font-bold mb-1.5 text-slate-900 dark:text-white leading-tight transition-colors duration-200">
                    {card.title}
                </h3>
                {card.subtitle && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 font-semibold uppercase tracking-wider">
                        {card.subtitle}
                    </div>
                )}
                <div className="text-[14px] text-slate-600 dark:text-slate-300 line-clamp-3 overflow-hidden leading-relaxed flex-1">
                    {(card.details || '').split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                            return <strong key={index} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
                        }
                        return <span key={index}>{part}</span>;
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className="flex gap-[6px] flex-wrap">
                    {card.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[11px] px-2 py-1 rounded-md font-medium text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-white/10 transition-colors">
                            #{tag}
                        </span>
                    ))}
                    {(card.tags?.length || 0) > 3 && (
                        <span className="text-[11px] text-slate-500 font-medium px-1.5 py-1">
                            +{(card.tags?.length || 0) - 3}
                        </span>
                    )}
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform group-hover:translate-x-1 shrink-0" weight="bold" />
            </div>
        </motion.div>
    );
});
