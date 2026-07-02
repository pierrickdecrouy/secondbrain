import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';
import type { Card } from '../types';
import { Check, PencilSimple } from '@phosphor-icons/react';

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
}

export const BrowseListItem: React.FC<BrowseListItemProps> = React.memo(({
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
    onDoubleSelect,
    onToggleSelect
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
            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 items-center group cursor-pointer transition-colors ${
                isSelected 
                    ? 'bg-indigo-50/40 dark:bg-indigo-900/30' 
                    : isActive 
                        ? 'bg-slate-50 dark:bg-slate-800/40' 
                        : 'bg-transparent'
            }`}
        >
            {/* Checkbox */}
            <div className="col-span-1" onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}>
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    readOnly
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-transparent cursor-pointer" 
                />
            </div>

            {/* Titre & Subtitle */}
            <div className="col-span-5 min-w-0 pr-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {card.title}
                </h4>
                {card.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {card.subtitle}
                    </p>
                )}
            </div>

            {/* Category badge */}
            <div className="col-span-2 flex min-w-0">
                <span 
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold truncate"
                    style={{
                        backgroundColor: darkMode ? '#1e293b' : `${getCategoryColor(card.type)}15`,
                        color: getCategoryColor(card.type),
                        border: `1px solid ${darkMode ? '#334155' : `${getCategoryColor(card.type)}30`}`,
                    }}
                >
                    {card.type === 'PATHO' ? 'PATHOLOGIE' : 
                     card.type === 'DRUG' ? 'MÉDICAMENT' : 
                     card.type === 'DATA' ? 'DONNÉE' : 
                     card.type}
                </span>
                
                <div className="flex gap-2 ml-2">
                    {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 flex-shrink-0">À revoir</span>
                    )}
                    {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 flex-shrink-0">Leech</span>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div className="col-span-3 flex min-w-0 overflow-hidden pr-2">
                {card.tags && card.tags.length > 0 ? (
                    <div className="flex gap-1 overflow-hidden w-full flex-nowrap items-center">
                        {card.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap truncate">
                                #{tag}
                            </span>
                        ))}
                        {card.tags.length > 3 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap">
                                +{card.tags.length - 3}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 italic">Sans tag</span>
                )}
            </div>

            {/* Actions */}
            <div className="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" aria-label="Éditer">
                    <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
            </div>
        </motion.div>
    );
});
