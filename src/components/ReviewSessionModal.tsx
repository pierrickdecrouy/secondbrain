import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X, CornersOut, CornersIn, ChartBar, Brain, Coffee, Timer } from '@phosphor-icons/react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { calculateFsrsProgress } from '../algorithms/fsrs';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ReviewSessionModalProps {
    cards: Card[];
    allCards: Card[];
    title?: string;
    onClose: () => void;
    onRate: (cardId: string, rating: 1 | 2 | 3 | 4) => void;
    onJumpToCard?: (cardId: string) => void;
    initialIndex?: number;
}

const REVIEW_ACTIONS: Array<{ rating: 1 | 2 | 3 | 4; label: string; className: string }> = [
    { rating: 1, label: 'Je ne connais pas', className: 'review-btn-1' },
    { rating: 2, label: 'Moyen', className: 'review-btn-2' },
    { rating: 3, label: 'Je connais', className: 'review-btn-3' },
    { rating: 4, label: 'Facile', className: 'review-btn-4' }
];

const COURSE_REVIEW_ACTIONS: Array<{ rating: 1 | 2 | 3 | 4; label: string; className: string }> = [
    { rating: 1, label: 'À revoir', className: 'review-btn-1' },
    { rating: 3, label: 'Maîtrisé', className: 'review-btn-3' }
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

const formatInterval = (dueDateIso: string) => {
    const diffMs = new Date(dueDateIso).getTime() - Date.now();
    const diffMins = Math.max(1, Math.round(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}j`;
    const diffMonths = Math.round(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${(diffMonths / 12).toFixed(1).replace('.0', '')}a`;
};

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
    cards,
    allCards,
    title,
    onClose,
    onRate,
    onJumpToCard,
    initialIndex = 0
}) => {
    const [index, setIndex] = useState(initialIndex);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [isPaused, setIsPaused] = useState(false);
    
    // Check if Easy Button is enabled
    const [showEasyButton, setShowEasyButton] = useState(false);
    const [autoFullscreen, setAutoFullscreen] = useState(false);
    useEffect(() => {
        try {
            const raw = localStorage.getItem('pharmabrain_srs_settings');
            if (raw) {
                const settings = JSON.parse(raw);
                setShowEasyButton(!!settings.showEasyButton);
                setAutoFullscreen(!!settings.autoFullscreen);
            }
        } catch (e) {}
    }, []);

    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (title === 'Quiz Express') {
            setQuizTimeLeft(30);
        } else {
            setQuizTimeLeft(null);
        }
    }, [index, title]);

    useEffect(() => {
        if (quizTimeLeft === null || isPaused || isAnswerRevealed) return;
        if (quizTimeLeft <= 0) {
            setIsAnswerRevealed(true);
            return;
        }
        const timerId = setInterval(() => {
            setQuizTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
        return () => clearInterval(timerId);
    }, [quizTimeLeft, isPaused, isAnswerRevealed]);

    const card = cards[index];

    useEffect(() => {
        // Auto-enter fullscreen when starting review if enabled
        if (autoFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.warn('Auto-fullscreen failed:', e));
        }

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [autoFullscreen]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(console.error);
            }
        }
    }, []);

    const handleClose = useCallback(() => {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(console.error);
        }
        onClose();
    }, [onClose]);

    // Reset answer revealed when changing card
    useEffect(() => {
        setIsAnswerRevealed(false);
        setShowStats(false);
    }, [index]);

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

    const nextIntervals = useMemo(() => {
        if (!card) return { 1: '', 2: '', 3: '', 4: '' };
        const isCourseType = card.nodeType === 'course' || card.nodeType === 'concept';
        return {
            1: formatInterval(calculateFsrsProgress(card.progress, 1, isCourseType).dueDate),
            2: formatInterval(calculateFsrsProgress(card.progress, 2, isCourseType).dueDate),
            3: formatInterval(calculateFsrsProgress(card.progress, 3, isCourseType).dueDate),
            4: formatInterval(calculateFsrsProgress(card.progress, 4, isCourseType).dueDate),
        };
    }, [card]);

    const isCourseType = card?.nodeType === 'course' || card?.nodeType === 'concept';
    const shouldReveal = isAnswerRevealed || isCourseType;

    const handleRate = useCallback((rating: 1 | 2 | 3 | 4) => {
        if (!card || !shouldReveal) return; // Prevent rating before revealing or if no card
        onRate(card.id, rating);
        if (index < cards.length - 1) {
            setIndex(prev => prev + 1);
        } else {
            // Close if it's the last card
            handleClose();
        }
    }, [card?.id, index, cards.length, onRate, shouldReveal, handleClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused) {
                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                    setIsPaused(false);
                    e.preventDefault();
                    e.stopPropagation();
                }
                return;
            }

            if (e.key === 'Escape') {
                handleClose();
                e.stopPropagation();
            } else if (e.key === ' ' || e.key === 'Enter') {
                if (!shouldReveal) {
                    setIsAnswerRevealed(true);
                    e.preventDefault();
                }
            } else if (shouldReveal) {
                if (e.key === '1') handleRate(1);
                else if (e.key === '2') handleRate(2);
                else if (e.key === '3') handleRate(3);
                else if (e.key === '4' && showEasyButton) handleRate(4);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRate, shouldReveal, handleClose, isPaused]);

    const modalRef = useFocusTrap(true);

    if (!card) return null;

    const qualityScore = card.progress?.difficulty ? (10 - card.progress.difficulty) * 10 : 50;

    return (
        <div className="modal-overlay focus-mode" style={{ padding: isFullscreen ? '0' : 'var(--modal-overlay-padding, 20px)' }}>
            
            <div ref={modalRef} className="modal-content review-modal-content" style={{ width: isFullscreen ? '100vw' : 'min(800px, 95vw)', height: isFullscreen ? '100vh' : 'auto', maxHeight: isFullscreen ? '100vh' : '85vh', borderRadius: isFullscreen ? '0' : '16px', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
                <div className="modal-header" style={{ display: 'block', borderBottom: 'none', paddingBottom: '0', background: 'var(--color-surface)', borderTopLeftRadius: isFullscreen ? '0' : '16px', borderTopRightRadius: isFullscreen ? '0' : '16px', paddingTop: '16px', paddingLeft: '24px', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: title === 'Bachotage Intensif' ? '2px' : '4px' }}>
                                <Brain size={24} weight="duotone" color="var(--color-drug)" />
                                <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>{title || 'Session de révision'}</h2>
                            </div>
                            {title === 'Bachotage Intensif' && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    Mode Entraînement — Sans impact sur vos plannings FSRS
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {quizTimeLeft !== null && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', background: quizTimeLeft <= 5 ? '#fee2e2' : 'var(--color-bg)', border: `1px solid ${quizTimeLeft <= 5 ? '#ef4444' : 'var(--color-border)'}`, borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, color: quizTimeLeft <= 5 ? '#ef4444' : 'var(--color-text-muted)', marginRight: '8px', transition: 'all 0.3s ease' }}>
                                    <Timer size={16} style={{ marginRight: '4px' }} weight={quizTimeLeft <= 5 ? 'bold' : 'regular'} />
                                    {quizTimeLeft}s
                                </div>
                            )}
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '8px' }}>
                                {index + 1} / {cards.length}
                            </div>
                            
                            <button className={`modal-close ${showStats ? 'active' : ''}`} onClick={() => setShowStats(!showStats)} title="Statistiques de la carte" style={{ background: showStats ? 'var(--color-bg)' : 'transparent', color: showStats ? 'var(--color-drug)' : 'var(--color-text-muted)' }}>
                                <ChartBar size={20} />
                            </button>

                            <button className={`modal-close ${isPaused ? 'active' : ''}`} onClick={() => setIsPaused(!isPaused)} title="Pause" style={{ background: isPaused ? 'var(--color-bg)' : 'transparent', color: isPaused ? 'var(--color-drug)' : 'var(--color-text-muted)' }}>
                                <Coffee size={20} />
                            </button>

                            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 4px' }} />
                            <button className="modal-close" onClick={toggleFullscreen} title={isFullscreen ? "Quitter le plein écran" : "Mettre au premier plan"}>
                                {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
                            </button>
                            <button className="modal-close" onClick={handleClose} title="Fermer"><X size={20} /></button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'var(--color-bg)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0' }}>
                        <div style={{ height: '100%', background: 'var(--color-drug)', width: `${((index + 1) / cards.length) * 100}%`, transition: 'width 0.3s ease' }} />
                    </div>
                </div>

                <div className="modal-body custom-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    
                    {isPaused ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            <Coffee size={64} weight="duotone" color="var(--color-drug)" style={{ marginBottom: 16 }} />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--color-text)' }}>Pause Café</h3>
                            <p style={{ fontSize: '1rem', marginBottom: 24, textAlign: 'center' }}>Prenez une respiration.<br/>La session est en pause.</p>
                            <button
                                onClick={() => setIsPaused(false)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    background: 'var(--color-drug)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow)',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                Reprendre
                            </button>
                        </div>
                    ) : (
                        <>
                    {showStats && (
                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Statut de la carte</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                                    {card.progress?.status === 'new' ? 'Nouvelle' : card.progress?.status === 'learning' ? 'En apprentissage' : 'À réviser'}
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Difficulté</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: qualityScore < 40 ? '#ef4444' : qualityScore > 70 ? '#10b981' : '#f59e0b' }}>
                                        {card.progress?.difficulty ? `${card.progress.difficulty.toFixed(1)} / 10` : 'N/A'}
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'var(--color-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: qualityScore < 40 ? '#ef4444' : qualityScore > 70 ? '#10b981' : '#f59e0b', width: `${card.progress?.difficulty ? (card.progress.difficulty / 10) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Stabilité</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-drug)' }}>
                                        {card.progress?.stability ? `${card.progress.stability.toFixed(1)} j` : 'N/A'}
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'var(--color-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--color-drug)', width: `${Math.min(100, (card.progress?.stability || 0) / 365 * 100)}%`, transition: 'width 0.3s ease' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Historique</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                                    {card.progress?.reps ?? 0} rép. <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>({card.progress?.lapses ?? 0} oublis)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`flip-card ${shouldReveal ? 'revealed' : ''}`}>
                        <div className="flip-card-inner">
                            {/* Front of Card (Question) */}
                            <div className="flip-card-front custom-scrollbar" style={{ border: card.progress?.isLeech ? '2px solid #ef4444' : '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                {card.progress?.isLeech && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px', width: '100%', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                                        <Brain size={24} weight="duotone" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Carte Difficile (Leech)</div>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Vous bloquez souvent sur cette carte. Envisagez de la modifier pour la rendre plus simple ou de la décomposer.</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    {card.format === 'cloze' ? (
                                        <div style={{ margin: '0 0 8px 0', fontSize: '1.75rem', color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.6 }}>
                                            {(card.content || '').split(/(\{.*?\}|\|\|.*?\|\|)/).map((part, i) => {
                                                if ((part.startsWith('{') && part.endsWith('}')) || (part.startsWith('||') && part.endsWith('||'))) {
                                                    return (
                                                        <span key={i} style={{ color: 'var(--color-text-muted)', fontWeight: 800, borderBottom: '2px dashed var(--color-border)', padding: '0 4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                            [...]
                                                        </span>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: 'var(--color-text)', fontWeight: 700 }}>{card.title}</h3>
                                            {card.subtitle && <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1.25rem', fontFamily: 'monospace' }}>{card.subtitle}</p>}
                                        </>
                                    )}
                                </div>
                                
                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <button 
                                        onClick={() => setIsAnswerRevealed(true)}
                                        style={{ background: 'var(--color-drug)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'transform 0.2s, background 0.2s', width: '100%', maxWidth: '400px' }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        Afficher la réponse
                                    </button>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Appuyez sur <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)' }}>Espace</kbd> pour révéler
                                    </div>
                                </div>
                            </div>

                            {/* Back of Card (Answer) */}
                            <div className="flip-card-back custom-scrollbar" style={{ border: '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    {card.format === 'cloze' ? (
                                        <div style={{ margin: '0 0 8px 0', fontSize: '1.75rem', color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.6, textAlign: 'center' }}>
                                            {(card.content || '').split(/(\{.*?\}|\|\|.*?\|\|)/).map((part, i) => {
                                                if ((part.startsWith('{') && part.endsWith('}')) || (part.startsWith('||') && part.endsWith('||'))) {
                                                    const clozeText = part.startsWith('{') ? part.slice(1, -1) : part.slice(2, -2);
                                                    return (
                                                        <span key={i} style={{ color: 'var(--color-drug)', fontWeight: 800, borderBottom: '2px dashed var(--color-drug)', padding: '0 4px', borderRadius: '4px', background: 'var(--color-drug-light)' }}>
                                                            {clozeText}
                                                        </span>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: 'var(--color-text)', fontWeight: 700 }}>{card.title}</h3>
                                            {card.subtitle && <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1.25rem', fontFamily: 'monospace' }}>{card.subtitle}</p>}
                                        </>
                                    )}
                                </div>

                                <div className="markdown-content" style={{ flex: 1 }}>
                                    {card.content && card.format !== 'cloze' && (
                                        <div style={{ marginBottom: card.details ? '24px' : '0' }}>
                                            <MarkdownRenderer content={card.content} />
                                        </div>
                                    )}
                                    
                                    {card.details && (
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--color-drug)', marginBottom: '24px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-drug)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>Détails de la réponse</div>
                                            <MarkdownRenderer content={card.details} />
                                        </div>
                                    )}
                                    
                                    {linkedRecommendations.length > 0 && (
                                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Parcours logique recommandé
                                            </div>
                                            <div className="links-list" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {linkedRecommendations.map(rec => (
                                                    <button key={rec.id} className="link-chip" onClick={() => onJumpToCard?.(rec.id)} style={{ padding: '6px 16px', fontSize: '0.85rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 500, transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-drug)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                                                        {rec.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                        </>
                    )}
                </div>

                {shouldReveal && (
                    <div style={{ padding: '20px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', animation: 'slideUp 0.3s ease-out' }}>
                        <div className="review-actions-container" style={{ display: 'flex', gap: '12px', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
                            {(isCourseType ? COURSE_REVIEW_ACTIONS : REVIEW_ACTIONS)
                                .filter(action => showEasyButton || action.rating !== 4)
                                .map(action => (
                                <button
                                    key={action.rating}
                                    className={`review-action-btn ${action.className}`}
                                    style={{ 
                                        flex: 1, 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px 16px', 
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s, filter 0.2s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                    onClick={() => handleRate(action.rating)}
                                    title={`Raccourci clavier: ${action.rating}`}
                                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
                                    onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{action.label}</div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {nextIntervals[action.rating]}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    .review-action-btn {
                        padding: 16px 8px !important;
                        min-height: 72px;
                    }
                    .review-actions-container {
                        gap: 8px !important;
                    }
                }
            `}</style>
        </div>
    );
};
