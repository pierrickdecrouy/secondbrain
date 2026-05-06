import React, { useMemo, useState } from 'react';
import { CaretLeft, CaretRight, EyeSlash, Eye, X } from '@phosphor-icons/react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ReviewSessionModalProps {
    cards: Card[];
    allCards: Card[];
    title?: string;
    onClose: () => void;
    onRate: (cardId: string, rating: 1 | 2 | 3) => void;
    onJumpToCard?: (cardId: string) => void;
}

const REVIEW_ACTIONS: Array<{ rating: 1 | 2 | 3; label: string; style: React.CSSProperties }> = [
    { rating: 1, label: 'Je ne connais pas', style: { background: '#fee2e2', color: '#991b1b' } },
    { rating: 2, label: 'Moyen', style: { background: '#fef3c7', color: '#92400e' } },
    { rating: 3, label: 'Je connais', style: { background: '#dcfce7', color: '#166534' } }
];

const getLinkedCardIds = (card: Card, allCards: Card[]): string[] => {
    const ids = new Set<string>(card.manualConnections || []);
    const text = `${card.content} ${card.details}`.toLowerCase();
    allCards.forEach((candidate) => {
        if (candidate.id === card.id) return;
        if (candidate.title.length >= 4 && text.includes(candidate.title.toLowerCase())) {
            ids.add(candidate.id);
        }
    });
    return Array.from(ids);
};

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
    cards,
    allCards,
    title,
    onClose,
    onRate,
    onJumpToCard
}) => {
    const [index, setIndex] = useState(0);
    const [hideSummary, setHideSummary] = useState(false);
    const [hideDetails, setHideDetails] = useState(true);

    const card = cards[index];
    const linkedRecommendations = useMemo(() => {
        if (!card) return [];
        const ids = getLinkedCardIds(card, allCards);
        return ids
            .map(id => allCards.find(c => c.id === id))
            .filter((c): c is Card => Boolean(c))
            .sort((a, b) => {
                const dueA = a.progress?.dueDate ? new Date(a.progress.dueDate).getTime() : 0;
                const dueB = b.progress?.dueDate ? new Date(b.progress.dueDate).getTime() : 0;
                return dueA - dueB;
            })
            .slice(0, 3);
    }, [card, allCards]);

    if (!card) return null;

    const handleRate = (rating: 1 | 2 | 3) => {
        onRate(card.id, rating);
        if (index < cards.length - 1) {
            setIndex(prev => prev + 1);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: 'min(980px, 95vw)', maxHeight: '92vh' }}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{title || 'Session de révision'}</h2>
                        <p className="modal-subtitle">Carte {index + 1} / {cards.length}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button className="browse-btn-icon" onClick={() => setHideSummary(v => !v)}>
                        {hideSummary ? <Eye size={16} /> : <EyeSlash size={16} />} Résumé
                    </button>
                    <button className="browse-btn-icon" onClick={() => setHideDetails(v => !v)}>
                        {hideDetails ? <Eye size={16} /> : <EyeSlash size={16} />} Détails
                    </button>
                </div>

                <div className="modal-body markdown-content" style={{ maxHeight: '54vh', overflow: 'auto' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>{card.title}</h3>
                    {card.subtitle && <p style={{ color: '#64748b', marginBottom: '1rem' }}>{card.subtitle}</p>}
                    {!hideSummary ? <MarkdownRenderer content={card.content} /> : <div style={{ color: '#94a3b8' }}>Résumé masqué — cliquez pour afficher.</div>}
                    <hr style={{ margin: '1rem 0' }} />
                    {!hideDetails ? <MarkdownRenderer content={card.details} /> : <div style={{ color: '#94a3b8' }}>Détails masqués — cliquez pour afficher.</div>}
                </div>

                {linkedRecommendations.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                            Parcours logique recommandé
                        </div>
                        <div className="links-list">
                            {linkedRecommendations.map(rec => (
                                <button key={rec.id} className="link-chip" onClick={() => onJumpToCard?.(rec.id)}>
                                    {rec.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="browse-btn-icon" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
                            <CaretLeft size={16} />
                        </button>
                        <button className="browse-btn-icon" onClick={() => setIndex(i => Math.min(cards.length - 1, i + 1))} disabled={index === cards.length - 1}>
                            <CaretRight size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {REVIEW_ACTIONS.map(action => (
                            <button
                                key={action.rating}
                                className="browse-filter-pill"
                                style={action.style}
                                onClick={() => handleRate(action.rating)}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
