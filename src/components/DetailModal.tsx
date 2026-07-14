import React, { useMemo, useState } from 'react';
import { X, Link, CaretLeft, CaretRight, EyeSlash, Eye } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchCards } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface DetailModalProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onLinkClick: (cardId: string) => void;
    actions?: React.ReactNode;
    onNext?: () => void;
    onPrev?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ card, allCards, onClose, onLinkClick, actions, onNext, onPrev }) => {
    const [isExamMode, setIsExamMode] = useState(false);
    
    // Find backlinks using FlexSearch (cards that contain this card's title)
    // This is faster and smarter (fuzzy, stemmed) than regex
    const backlinks = useMemo(() => {
        if (!card.title) return [];

        // Search for the card title in the index
        // This returns IDs of cards containing the title
        const matchingIds = searchCards(card.title);
        const uniqueIds = new Set(matchingIds);
        uniqueIds.delete(card.id); // Exclude self

        // Map IDs back to card objects
        return allCards
            .filter(c => uniqueIds.has(c.id))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [card, allCards]);

    // Find forward links: cards mentioned in current card's details
    // We keep this heuristic (checking if OTHER titles appear in THIS text)
    const forwardLinks = useMemo(() => {
        const searchText = (card.details + ' ' + card.content).toLowerCase();

        return allCards.filter(c => {
            if (c.id === card.id) return false;
            // Optimization: Only check titles > 3 chars to avoid noise
            if (c.title.length < 3) return false;

            const titleLower = c.title.toLowerCase();
            // Simple includes check is much faster than regex
            return searchText.includes(titleLower);
        }).sort((a, b) => a.title.localeCompare(b.title));
    }, [card, allCards]);

    // Calculate Quality Score
    const quality = useMemo(() => {
        // Find semantic neighbors count (heuristic: similar number to backlinks for now, or just pass it if available)
        // For now, we use backlinks count as a proxy for "connectivity"
        return calculateQualityScore(card, backlinks.length + forwardLinks.length);
    }, [card, backlinks.length, forwardLinks.length]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && onNext) {
                onNext();
            } else if (e.key === 'ArrowLeft' && onPrev) {
                onPrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev]);

    const modalRef = useFocusTrap(true);

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>


            <motion.div ref={modalRef} layoutId={`card-${card.id}`} className="modal-content glass-modal flex flex-col p-0">
                {/* Header */}
                <header className="modal-header py-6 px-8 border-b border-[color:var(--border-light)] flex justify-between items-start flex-wrap gap-4">
                    <div className="flex flex-col gap-2 flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge type={card.type} />
                            {/* Quality Indicator */}
                            <div
                                title={`Score de qualité : ${quality.score}/100\nContenu: ${quality.details.contentScore}\nConnexions: ${quality.details.connectivityScore}\nMétadonnées: ${quality.details.metadataScore}`}
                                className="flex items-center gap-1.5 py-0.5 px-2 rounded-xl text-xs font-semibold cursor-help border"
                                style={{
                                    background: `${quality.color}20`, // 12% opacity
                                    borderColor: `${quality.color}40`,
                                    color: quality.color,
                                }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: quality.color }} />
                                {quality.label} ({quality.score}%)
                            </div>
                        </div>
                        <h2 className="modal-title m-0 text-3xl font-bold leading-[1.2] tracking-[-0.02em]">{card.title}</h2>
                        {card.subtitle && <p className="modal-subtitle mt-1.5 text-[1.05rem] opacity-90">{card.subtitle}</p>}
                    </div>
                    
                    {/* Actions */}
                    <div className="modal-header-actions flex gap-1 items-center shrink-0">
                        {actions}
                        <div className="w-[1px] h-4 bg-[color:var(--border-light)] mx-2" />
                        {onPrev && (
                            <button className="browse-action-btn" onClick={(e) => { e.stopPropagation(); onPrev(); }} title="Précédent (Flèche Gauche)">
                                <CaretLeft size={20} weight="bold" />
                            </button>
                        )}
                        {onNext && (
                            <button className="browse-action-btn" onClick={(e) => { e.stopPropagation(); onNext(); }} title="Suivant (Flèche Droite)">
                                <CaretRight size={20} weight="bold" />
                            </button>
                        )}
                        <button className={`browse-action-btn ${isExamMode ? 'text-primary' : ''}`} onClick={() => setIsExamMode(!isExamMode)} title={isExamMode ? "Désactiver le Mode Examen" : "Activer le Mode Examen"}>
                            {isExamMode ? <Eye size={20} /> : <EyeSlash size={20} />}
                        </button>
                        <button className="browse-action-btn" onClick={onClose} title="Fermer">
                            <X size={20} weight="bold" />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className={`modal-body markdown-content custom-scrollbar flex-1 overflow-y-auto p-8 ${isExamMode ? 'exam-mode' : ''}`}>
                    {/* Image display */}
                    {card.imageUrl && (
                        <div className="modal-image mb-6">
                            <img src={card.imageUrl} alt={card.title} className="w-full rounded-xl" />
                        </div>
                    )}

                    {/* Summary block */}
                    {card.content && card.content.trim() !== card.details?.trim() && (
                        <div className="modal-summary">
                            <MarkdownRenderer 
                                content={card.content} 
                                onInternalLinkClick={(target) => {
                                    const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                    if (found) {
                                        onLinkClick(found.id);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Details */}
                    {card.details && (
                        <div className={`modal-main-content ${card.content && card.content.trim() !== card.details?.trim() ? 'mt-6' : 'mt-0'}`}>
                            {card.content && card.content.trim() !== card.details?.trim() && (
                                <h4 className="uppercase text-[0.85rem] text-[color:var(--text-grey)] mb-3 tracking-[0.05em]">Détails</h4>
                            )}
                            <MarkdownRenderer 
                                content={card.details} 
                                onInternalLinkClick={(target) => {
                                    const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                    if (found) {
                                        onLinkClick(found.id);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Forward links */}
                    {forwardLinks.length > 0 && (
                        <section className="mt-12">
                            <h4 className="flex items-center gap-2 uppercase text-[0.85rem] text-[color:var(--text-grey)] mb-4 tracking-[0.05em]">
                                <Link size={16} />
                                Liens sortants ({forwardLinks.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {forwardLinks.map(link => (
                                    <button
                                        key={link.id}
                                        className="link-chip"
                                        data-type={link.type}
                                        onClick={() => onLinkClick(link.id)}
                                    >
                                        {link.title}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Backlinks */}
                    {backlinks.length > 0 && (
                        <section className="mt-8">
                            <h4 className="flex items-center gap-2 uppercase text-[0.85rem] text-[color:var(--text-grey)] mb-4 tracking-[0.05em]">
                                <Link size={16} />
                                Mentionné dans : ({backlinks.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {backlinks.map(link => (
                                    <button
                                        key={link.id}
                                        className="link-chip"
                                        data-type={link.type}
                                        onClick={() => onLinkClick(link.id)}
                                    >
                                        {link.title}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tags */}
                    {card.tags && card.tags.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-2 border-t border-[color:var(--border-light)] pt-6">
                            {card.tags.map(tag => (
                                <span key={tag} className="text-sm text-[color:var(--text-grey)] border border-[color:var(--border-light)] py-1 px-3 rounded-full">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

