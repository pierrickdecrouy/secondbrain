import { useMemo } from 'react';
import { X } from 'lucide-react';
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
    const processedContent = useMemo(() => {
        let html = card.details;

        const targets = allCards
            .filter(c => c.id !== card.id)
            .sort((a, b) => b.title.length - a.title.length);

        targets.forEach(target => {
            const regex = new RegExp(`(${target.title})`, 'gi');
            html = html.replace(regex, (match) => {
                return `<button class="keyword-link" data-type="${target.type}" data-link="${target.id}">${match}</button>`;
            });
        });

        return html;
    }, [card, allCards]);

    const handleContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const linkBtn = target.closest('[data-link]');
        if (linkBtn) {
            e.preventDefault();
            const cardId = linkBtn.getAttribute('data-link');
            if (cardId) {
                onLinkClick(cardId);
            }
        }
    };

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
                        <h2 className="modal-title" dangerouslySetInnerHTML={{ __html: card.title }} />
                        <p className="modal-subtitle">{card.subtitle}</p>
                    </div>
                    <div className="modal-header-actions">
                        {actions}
                        <button className="modal-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div
                    className="modal-body"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    onClick={handleContentClick}
                />

                <div className="modal-tags">
                    {card.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};
