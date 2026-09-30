import React from 'react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { stripMarkdown } from '../utils';
import { safeHtml } from '../utils/sanitize';

interface CardItemProps {
    card: Card;
    onClick: (card: Card) => void;
    onEdit?: (card: Card) => void;
    onDelete?: (card: Card) => void;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onClick, onEdit, onDelete }) => {
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(card);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(card);
    };

    return (
        <div className="card-item" onClick={() => onClick(card)}>
            <div className="card-actions">
                {onEdit && (
                    <button className="card-action-btn" onClick={handleEdit} title="Modifier">
                        <PencilSimple size={14} />
                    </button>
                )}
                {onDelete && (
                    <button className="card-action-btn delete" onClick={handleDelete} title="Supprimer">
                        <Trash size={14} />
                    </button>
                )}
            </div>

            <Badge type={card.type} className="card-badge" />
            <h3 className="card-title" dangerouslySetInnerHTML={safeHtml(card.title || '')} />
            {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
            <p className="card-content">
                {stripMarkdown(card.content)}
            </p>
        </div>
    );
};
