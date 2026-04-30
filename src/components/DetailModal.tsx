import React, { useMemo, useState } from 'react';
import { X, Link2, ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchCards } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { segmentCard } from '../synthesisService';
import { loadSegmentProgress } from '../storage';
import { SegmentReviewModal } from './SegmentReviewModal';

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
    const [showSegmentReview, setShowSegmentReview] = useState(false);

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

    // Compute segments for micro-learning
    const segments = useMemo(() => segmentCard(card), [card]);
    const segmentProgress = useMemo(() => loadSegmentProgress(), [card.id]);

    // Count how many segments have been reviewed
    const reviewedSegments = segments.filter(s => segmentProgress[s.id]).length;

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

                {/* Micro-Learning: Segment overview */}
                {segments.length > 1 && (
                    <div style={{
                        margin: '0 0 0 0',
                        padding: '14px 24px',
                        background: '#f8f7ff',
                        borderTop: '1px solid #ede9fe',
                        borderBottom: '1px solid #ede9fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#6d28d9', fontWeight: 600 }}>
                            <Layers size={15} />
                            {segments.length} sections · {reviewedSegments} évaluée{reviewedSegments !== 1 ? 's' : ''}
                        </div>
                        <button
                            onClick={() => setShowSegmentReview(true)}
                            style={{
                                background: '#6d28d9',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <BookOpen size={13} />
                            Réviser par sections
                        </button>
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

            {/* Segment Review Modal */}
            {showSegmentReview && (
                <SegmentReviewModal
                    segments={segments}
                    cardTitle={card.title}
                    onClose={() => setShowSegmentReview(false)}
                />
            )}
        </div>
    );
};

