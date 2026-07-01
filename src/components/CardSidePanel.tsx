import React, { useMemo, useState, useEffect } from 'react';
import { X, PushPin, PushPinSlash, CaretLeft, CaretRight, Link, CornersOut, EyeSlash, Eye } from '@phosphor-icons/react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { searchCards } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';

interface CardSidePanelProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onPinToggle: () => void;
    pinned: boolean;
    onLinkClick: (cardId: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    onExpand?: () => void;
}

export const CardSidePanel: React.FC<CardSidePanelProps> = ({
    card,
    allCards,
    onClose,
    onPinToggle,
    pinned,
    onLinkClick,
    onPrev,
    onNext,
    onExpand
}) => {
    const [isExamMode, setIsExamMode] = useState(false);

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


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key === 'ArrowLeft' && onPrev) {
                onPrev();
            } else if (e.key === 'ArrowRight' && onNext) {
                onNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onPrev, onNext]);

    const quality = calculateQualityScore(card, card.manualConnections?.length || 0);

    return (
        <aside className="card-side-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)', padding: 0 }}>
            {/* Header */}
            <header className="modal-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Badge type={card.type} />
                        {/* Quality Indicator */}
                        <div
                            title={`Score de qualité : ${quality.score}/100`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: `${quality.color}20`,
                                border: `1px solid ${quality.color}40`,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: quality.color,
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
                <div className="modal-header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {onPrev && (
                        <button className="browse-action-btn" onClick={onPrev} title="Précédent">
                            <CaretLeft size={18} weight="bold" />
                        </button>
                    )}
                    {onNext && (
                        <button className="browse-action-btn" onClick={onNext} title="Suivant">
                            <CaretRight size={18} weight="bold" />
                        </button>
                    )}
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 8px' }} />
                    
                                        {onExpand && (
                        <button className="browse-action-btn" onClick={onExpand} title="Plein écran">
                            <CornersOut size={18} />
                        </button>
                    )}
                    <button className={`browse-action-btn ${isExamMode ? 'text-primary' : ''}`} onClick={() => setIsExamMode(!isExamMode)} title={isExamMode ? "Désactiver le Mode Examen" : "Activer le Mode Examen"}>
                        {isExamMode ? <Eye size={18} /> : <EyeSlash size={18} />}
                    </button>
                    <button className="browse-action-btn" onClick={onPinToggle} title={pinned ? 'Dépingler' : 'Épingler'}>
                        {pinned ? <PushPinSlash size={18} /> : <PushPin size={18} />}
                    </button>
                    <button className="browse-action-btn" onClick={onClose} title="Fermer">
                        <X size={18} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className={`modal-body markdown-content custom-scrollbar ${isExamMode ? 'exam-mode' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
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

                {/* Backlinks */}
                {backlinks.length > 0 && (
                    <section style={{ marginTop: '32px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '12px', letterSpacing: '0.05em' }}>
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
            </div>
        </aside>
    );
};
