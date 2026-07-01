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


            <motion.div ref={modalRef} layoutId={`card-${card.id}`} className="modal-content glass-modal" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Header */}
                <header className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Badge type={card.type} />
                            {/* Quality Indicator */}
                            <div
                                title={`Score de qualité : ${quality.score}/100\nContenu: ${quality.details.contentScore}\nConnexions: ${quality.details.connectivityScore}\nMétadonnées: ${quality.details.metadataScore}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: `${quality.color}20`, // 12% opacity
                                    border: `1px solid ${quality.color}40`,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: quality.color,
                                    cursor: 'help'
                                }}
                            >
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: quality.color }} />
                                {quality.label} ({quality.score}%)
                            </div>
                        </div>
                        <h2 className="modal-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{card.title}</h2>
                        {card.subtitle && <p className="modal-subtitle" style={{ marginTop: '6px', fontSize: '1.05rem', opacity: 0.9 }}>{card.subtitle}</p>}
                    </div>
                    
                    {/* Actions */}
                    <div className="modal-header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {actions}
                        <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 8px' }} />
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
                <div className={`modal-body markdown-content custom-scrollbar ${isExamMode ? 'exam-mode' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {/* Image display */}
                    {card.imageUrl && (
                        <div className="modal-image" style={{ marginBottom: '24px' }}>
                            <img src={card.imageUrl} alt={card.title} style={{ width: '100%', borderRadius: '12px' }} />
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
                        <div className="modal-main-content" style={{ marginTop: (card.content && card.content.trim() !== card.details?.trim()) ? '24px' : '0' }}>
                            {card.content && card.content.trim() !== card.details?.trim() && (
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '12px', letterSpacing: '0.05em' }}>Détails</h4>
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
                        <section style={{ marginTop: '48px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                <Link size={16} />
                                Liens sortants ({forwardLinks.length})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        <section style={{ marginTop: '32px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                <Link size={16} />
                                Mentionné dans : ({backlinks.length})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
                            {card.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.8rem', color: 'var(--text-grey)', border: '1px solid var(--border-light)', padding: '4px 12px', borderRadius: '16px' }}>#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

