import React, { useMemo } from 'react';
import { X, Link2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchCards } from '../searchIndex';

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

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            {/* Navigation Buttons (Outside wrapper for better clickable area) */}
            {onPrev && (
                <button
                    className="nav-arrow-btn prev"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    title="Précédent (Flèche Gauche)"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {onNext && (
                <button
                    className="nav-arrow-btn next"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    title="Suivant (Flèche Droite)"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            <div className="modal-content">
                <div className="modal-header">
                    <div>
                        <Badge type={card.type} />
                        <h2 className="modal-title">{card.title}</h2>
                        <p className="modal-subtitle">{card.subtitle}</p>

                        {/* Summary / Abstract rendered with Markdown */}
                        <div className="modal-summary" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #cbd5e1' }}>
                            <MarkdownRenderer content={card.content} className="text-sm text-slate-600" />
                        </div>
                    </div>
                    <div className="modal-header-actions">
                        {actions}
                        <button className="modal-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Image display */}
                {card.imageUrl && (
                    <div className="modal-image">
                        <img src={card.imageUrl} alt={card.title} />
                    </div>
                )}

                {/* Markdown content */}
                <div className="modal-body markdown-content">
                    <MarkdownRenderer content={card.details} />
                </div>

                {/* Forward links (cards mentioned in this card) */}
                {forwardLinks.length > 0 && (
                    <div className="modal-links">
                        <h4 className="links-title">
                            <Link2 size={14} />
                            Liens sortants ({forwardLinks.length})
                        </h4>
                        <div className="links-list">
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
                    </div>
                )}

                {/* Backlinks (cards that mention this card) */}
                {backlinks.length > 0 && (
                    <div className="modal-backlinks">
                        <h4 className="links-title">
                            <Link2 size={14} />
                            Références entrantes ({backlinks.length})
                        </h4>
                        <div className="links-list">
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
                    </div>
                )}

                <div className="modal-tags">
                    {card.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

