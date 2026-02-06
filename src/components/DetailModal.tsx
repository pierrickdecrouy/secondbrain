import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Link2 } from 'lucide-react';
import type { Card } from '../types';
import { Badge } from './Badge';

interface DetailModalProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onLinkClick: (cardId: string) => void;
    actions?: React.ReactNode;
}

export const DetailModal: React.FC<DetailModalProps> = ({ card, allCards, onClose, onLinkClick, actions }) => {
    // Find backlinks: cards that mention current card's title in their details
    const backlinks = useMemo(() => {
        const titleLower = card.title.toLowerCase();
        return allCards.filter(c => {
            if (c.id === card.id) return false;
            const searchText = (c.details + ' ' + c.content).toLowerCase();
            // Use word boundary check
            const escapedTitle = titleLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedTitle}\\b`, 'i');
            return regex.test(searchText);
        });
    }, [card, allCards]);

    // Find forward links: cards mentioned in current card's details
    const forwardLinks = useMemo(() => {
        return allCards.filter(c => {
            if (c.id === card.id) return false;
            const titleLower = c.title.toLowerCase();
            const searchText = (card.details + ' ' + card.content).toLowerCase();
            const escapedTitle = titleLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedTitle}\\b`, 'i');
            return regex.test(searchText);
        });
    }, [card, allCards]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <div>
                        <Badge type={card.type} />
                        <h2 className="modal-title">{card.title}</h2>
                        <p className="modal-subtitle">{card.subtitle}</p>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {card.details}
                    </ReactMarkdown>
                </div>

                {/* Forward links (cards mentioned in this card) */}
                {forwardLinks.length > 0 && (
                    <div className="modal-links">
                        <h4 className="links-title">
                            <Link2 size={14} />
                            Liens vers
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
                            Référencé par
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
