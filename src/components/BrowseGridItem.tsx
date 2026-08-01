import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';
import type { Card } from '../types';
import { Check, Trash } from '@phosphor-icons/react';
import './styles/BrowseGridItem.css';

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

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[(.+?)\]\(.*?\)/g, '$1')
        .replace(/>\s+/g, '')
        .replace(/\n+/g, ' ')
        .trim();
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
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            onToggleSelect(card.id, e);
        } else {
            onSelect(card.id);
        }
    };

    const categoryColor = getCategoryColor(card.type);
    const badgeBg = hexToRgba(categoryColor, darkMode ? 0.15 : 0.1);
    const glowBg = hexToRgba(categoryColor, darkMode ? 0.1 : 0.08);
    const borderColor = darkMode ? '#1e293b' : '#f1f5f9';
    const tagBg = darkMode ? '#1e293b' : '#f1f5f9';
    const tagColor = darkMode ? '#94a3b8' : '#64748b';
    const textMuted = darkMode ? '#64748b' : '#94a3b8';

    const rawExcerpt = card.details || card.content || '';
    const excerpt = stripMarkdown(rawExcerpt);
    const displayExcerpt = excerpt.length > 120 ? excerpt.slice(0, 120) + '…' : excerpt;

    const isDue = card.progress?.dueDate && new Date(card.progress?.dueDate) <= new Date();
    const isActive = selectedCardId === card.id && !isSelectionMode;

    return (
        <motion.div
            layoutId={`card-${card.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir la carte ${card.title}`}
            aria-pressed={isSelected}
            className={`browse-card h-full ${isActive ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[var(--color-bg)]' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e as any);
                }
            }}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        >
            {/* Lueur de coin — se révèle au hover */}
            <div
                aria-hidden
                className="browsegriditem-style-1" style={{
  backgroundColor: glowBg,
  opacity: isHovered ? 1 : 0
}}
            />

            {/* Contenu au-dessus du glow */}
            <div className="browsegriditem-style-2" >

                {/* ── Header : badge + action/checkbox ── */}
                <div className="browsegriditem-style-3" >

                    {/* Badge type — fond pastel + icône fill */}
                    <span className="browsegriditem-style-4" style={{
  backgroundColor: badgeBg,
  color: categoryColor
}}>
                        <DynamicIcon name={getCategoryIcon(card.type)} size={12} weight="fill" />
                        {card.type}
                    </span>

                    {/* Côté droit : checkbox au hover/sélection, ou bouton delete au hover */}
                    <div className="browsegriditem-style-5" >
                        {/* Checkbox — visible au hover ou en mode sélection */}
                        {(isSelectionMode || isHovered) && (
                            <div
                                role="checkbox"
                                aria-checked={isSelected}
                                aria-label={`Sélectionner ${card.title}`}
                                onClick={(e) => { e.stopPropagation(); onToggleSelect(card.id, e); }}
                                className="browsegriditem-style-6" style={{
  border: `2px solid ${isSelected ? '#10b981' : darkMode ? '#334155' : '#cbd5e1'}`,
  backgroundColor: isSelected ? '#10b981' : darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
}}
                            >
                                {isSelected && <Check size={10} weight="bold" color="white" />}
                            </div>
                        )}

                        {/* Bouton suppression — visible au hover uniquement, hors sélection */}
                        {!isSelectionMode && onDelete && isHovered && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(card.id, e); }}
                                aria-label="Supprimer la carte"
                                className="browsegriditem-style-7" style={{
  color: darkMode ? '#475569' : '#94a3b8'
}}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = darkMode ? '#475569' : '#94a3b8';
                                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                }}
                            >
                                <Trash size={13} weight="bold" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Titre ── */}
                <h3 className="browsegriditem-style-8" style={{
  marginBottom: card.subtitle ? 3 : 0,
  color: isHovered ? categoryColor : 'var(--color-text)'
}}>
                    {card.title}
                </h3>

                {/* ── Sous-titre ── */}
                {card.subtitle && (
                    <p className="browsegriditem-style-9" >
                        {card.subtitle}
                    </p>
                )}

                {/* ── Extrait — 2 lignes, Markdown strippé ── */}
                {displayExcerpt && (
                    <p style={{
                        fontSize: '0.81rem',
                        lineHeight: 1.6,
                        color: 'var(--color-text-muted)',
                        margin: '8px 0 0 0',
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}>
                        {displayExcerpt}
                    </p>
                )}

                {/* ── Footer : tags + point de révision ── */}
                <div className="browsegriditem-style-10" style={{
  borderTop: `1px solid ${borderColor}`
}}>
                    <div className="browsegriditem-style-11" >
                        {/* Badges d'état */}
                        {activeFilters.includes('needs-review') && calculateQualityScore(card, card.manualConnections?.length || 0).score < 50 && (
                            <span className="browsegriditem-style-12" >
                                À revoir
                            </span>
                        )}
                        {(card.progress?.isLeech || (card.progress?.lapses ?? 0) >= 8) && (
                            <span className="browsegriditem-style-13" >
                                Leech
                            </span>
                        )}
                        {/* Tags */}
                        {card.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="browsegriditem-style-14" style={{
  backgroundColor: tagBg,
  color: tagColor
}}>
                                #{tag}
                            </span>
                        ))}
                        {(card.tags?.length || 0) > 2 && (
                            <span className="browsegriditem-style-15" style={{
  backgroundColor: tagBg,
  color: textMuted
}}>
                                +{(card.tags?.length || 0) - 2}
                            </span>
                        )}
                    </div>

                    {/* Point vert si révision due */}
                    {isDue && (
                        <div
                            title="À réviser aujourd'hui"
                            className="browsegriditem-style-16" 
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
});
