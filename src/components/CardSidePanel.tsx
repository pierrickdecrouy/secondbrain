import React, { useMemo } from 'react';
import { X, PushPin, PushPinSlash, CaretLeft, CaretRight, Link } from '@phosphor-icons/react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchCards } from '../searchIndex';

interface CardSidePanelProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onPinToggle: () => void;
    pinned: boolean;
    onLinkClick: (cardId: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
}

export const CardSidePanel: React.FC<CardSidePanelProps> = ({
    card,
    allCards,
    onClose,
    onPinToggle,
    pinned,
    onLinkClick,
    onPrev,
    onNext
}) => {
    const backlinks = useMemo(() => {
        if (!card.title) return [];
        const matchingIds = searchCards(card.title);
        const uniqueIds = new Set(matchingIds);
        uniqueIds.delete(card.id);
        return allCards
            .filter(c => uniqueIds.has(c.id))
            .sort((a, b) => a.title.localeCompare(b.title))
            .slice(0, 12);
    }, [card, allCards]);

    return (
        <aside className="card-side-panel">
            <header className="card-side-panel-header">
                <div className="card-side-panel-title-wrap">
                    <Badge type={card.type} />
                    <h3 className="card-side-panel-title">{card.title}</h3>
                </div>
                <div className="card-side-panel-actions">
                    <button className="browse-action-btn" onClick={onPinToggle} title={pinned ? 'Désépingler' : 'Épingler'}>
                        {pinned ? <PushPinSlash size={16} /> : <PushPin size={16} />}
                    </button>
                    <button className="browse-action-btn" onClick={onClose} title="Fermer">
                        <X size={16} />
                    </button>
                </div>
            </header>

            <div className="card-side-panel-nav">
                <button className="browse-action-btn" onClick={onPrev} disabled={!onPrev} title="Précédent">
                    <CaretLeft size={16} />
                </button>
                <button className="browse-action-btn" onClick={onNext} disabled={!onNext} title="Suivant">
                    <CaretRight size={16} />
                </button>
            </div>

            {card.subtitle && <p className="card-side-panel-subtitle">{card.subtitle}</p>}

            <section className="card-side-panel-section">
                <h4>Résumé</h4>
                <MarkdownRenderer content={card.content} className="text-sm" />
            </section>

            <section className="card-side-panel-section">
                <h4>Détails</h4>
                <MarkdownRenderer content={card.details} className="text-sm" />
            </section>

            {backlinks.length > 0 && (
                <section className="card-side-panel-section">
                    <h4 className="card-side-panel-links-title">
                        <Link size={14} />
                        Références ({backlinks.length})
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
                </section>
            )}
        </aside>
    );
};
