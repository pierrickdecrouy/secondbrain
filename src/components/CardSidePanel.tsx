import React, { useMemo, useState, useEffect } from 'react';
import { X, PushPin, PushPinSlash, CaretLeft, CaretRight, Link, CornersOut, CornersIn } from '@phosphor-icons/react';
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

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key === 'ArrowLeft' && onPrev) {
                onPrev();
            } else if (e.key === 'ArrowRight' && onNext) {
                onNext();
            } else if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onPrev, onNext, isFullscreen]);

    const panelStyle: React.CSSProperties = isFullscreen ? {
        position: 'fixed',
        top: '5vh',
        left: '10vw',
        width: '80vw',
        height: '90vh',
        zIndex: 1000,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column'
    } : { position: 'relative' };

    return (
        <aside className="card-side-panel" style={panelStyle}>
            {isFullscreen && (
                <div 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: -1, borderRadius: 0 }} 
                    onClick={() => setIsFullscreen(false)}
                />
            )}
            

            <header className="card-side-panel-header">
                <div className="card-side-panel-title-wrap">
                    <Badge type={card.type} />
                    <h3 className="card-side-panel-title">{card.title}</h3>
                </div>
                <div className="card-side-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {onPrev && (
                        <button className="browse-action-btn" onClick={onPrev} title="Précédent (Flèche Gauche)">
                            <CaretLeft size={16} weight="bold" />
                        </button>
                    )}
                    {onNext && (
                        <button className="browse-action-btn" onClick={onNext} title="Suivant (Flèche Droite)">
                            <CaretRight size={16} weight="bold" />
                        </button>
                    )}
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 4px' }} />
                    <button className="browse-action-btn" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Quitter le premier plan" : "Mettre au premier plan"}>
                        {isFullscreen ? <CornersIn size={16} /> : <CornersOut size={16} />}
                    </button>
                    {!isFullscreen && (
                        <button className="browse-action-btn" onClick={onPinToggle} title={pinned ? 'Dépingler' : 'Épingler'}>
                            {pinned ? <PushPinSlash size={16} /> : <PushPin size={16} />}
                        </button>
                    )}
                    <button className="browse-action-btn" onClick={onClose} title="Fermer">
                        <X size={16} />
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
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
            </div>
        </aside>
    );
};
