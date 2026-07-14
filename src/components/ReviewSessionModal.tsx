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

    const allCardsMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]);

    const linkedRecommendations = useMemo(() => {
        if (!card) return [];
        const ids = getLinkedCardIds(card, allCards);
        return ids
            .map(id => allCardsMap.get(id))
            .filter((c): c is Card => Boolean(c))
            .sort((a, b) => {
                const dueA = a.progress?.dueDate ? new Date(a.progress.dueDate).getTime() : 0;
                const dueB = b.progress?.dueDate ? new Date(b.progress.dueDate).getTime() : 0;
                return dueA - dueB;
            })
            .slice(0, 3);
    }, [card, allCardsMap, allCards]);

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
        <div className={`modal-overlay focus-mode ${isFullscreen ? "p-0" : "p-5"}`}>
            
            <div ref={modalRef} className={`modal-content review-modal-content flex flex-col bg-[color:var(--color-bg)] ${isFullscreen ? "w-screen h-screen max-h-screen rounded-none" : "w-[min(800px,95vw)] h-auto max-h-[85vh] rounded-2xl"}`}>
                <div className={`modal-header block border-b-0 pb-0 bg-[color:var(--color-surface)] pt-4 px-6 ${isFullscreen ? "rounded-t-none" : "rounded-t-2xl"}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <div className={`flex items-center gap-2 ${title === 'Bachotage Intensif' ? "mb-0.5" : "mb-1"}`}>
                                <Brain size={24} weight="duotone" className="text-[color:var(--color-drug)]" />
                                <h2 className="modal-title m-0 text-xl">{title || 'Session de révision'}</h2>
                            </div>
                            {title === 'Bachotage Intensif' && (
                                <div className="text-xs text-[color:var(--color-text-muted)] font-medium">
                                    Mode Entraînement — Sans impact sur vos plannings FSRS
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 items-center">
                            {quizTimeLeft !== null && (
                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold mr-2 transition-all border ${quizTimeLeft <= 5 ? "bg-red-100 border-red-500 text-red-500" : "bg-[color:var(--color-bg)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"}`}>
                                    <Timer size={16} className="mr-1" weight={quizTimeLeft <= 5 ? 'bold' : 'regular'} />
                                    {quizTimeLeft}s
                                </div>
                            )}
                            <div className="inline-flex items-center bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-full px-3 py-1 text-sm font-semibold text-[color:var(--color-text-muted)] mr-2">
                                {index + 1} / {cards.length}
                            </div>
                            
                            <button className={`modal-close ${showStats ? 'bg-[color:var(--color-bg)] text-[color:var(--color-drug)]' : 'bg-transparent text-[color:var(--color-text-muted)]'}`} onClick={() => setShowStats(!showStats)} title="Statistiques de la carte">
                                <ChartBar size={20} />
                            </button>

                            <button className={`modal-close ${isPaused ? 'bg-[color:var(--color-bg)] text-[color:var(--color-drug)]' : 'bg-transparent text-[color:var(--color-text-muted)]'}`} onClick={() => setIsPaused(!isPaused)} title="Pause">
                                <Coffee size={20} />
                            </button>

                            <div className="w-[1px] h-5 bg-[color:var(--color-border)] mx-1" />
                            <button className="modal-close" onClick={toggleFullscreen} title={isFullscreen ? "Quitter le plein écran" : "Mettre au premier plan"}>
                                {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
                            </button>
                            <button className="modal-close" onClick={handleClose} title="Fermer"><X size={20} /></button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-[color:var(--color-bg)] rounded-full overflow-hidden mb-0">
                        <div className="h-full bg-[color:var(--color-drug)] transition-[width] duration-300 ease-in-out" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
                    </div>
                </div>

                <div className="modal-body custom-scrollbar flex-1 overflow-auto p-6 flex flex-col relative">
                    
                    {isPaused ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[color:var(--color-text-muted)]">
                            <Coffee size={64} weight="duotone" className="text-[color:var(--color-drug)] mb-4" />
                            <h3 className="text-2xl mb-2 text-[color:var(--color-text)]">Pause Café</h3>
                            <p className="text-base mb-6 text-center">Prenez une respiration.<br/>La session est en pause.</p>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="px-6 py-2.5 rounded-xl bg-[color:var(--color-drug)] text-white border-none font-semibold text-base cursor-pointer shadow-md transition-all duration-150 hover:-translate-y-0.5"
                            >
                                Reprendre
                            </button>
                        </div>
                    ) : (
                        <>
                    {showStats && (
                        <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl p-5 mb-6 shadow-[var(--shadow)] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
                            <div>
                                <div className="text-xs text-[color:var(--color-text-muted)] uppercase font-bold tracking-wider">Statut de la carte</div>
                                <div className="text-lg font-semibold text-[color:var(--color-text)] mt-1">
                                    {card.progress?.status === 'new' ? 'Nouvelle' : card.progress?.status === 'learning' ? 'En apprentissage' : 'À réviser'}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-[color:var(--color-text-muted)] uppercase font-bold tracking-wider">Difficulté</div>
                                    <div className="text-sm font-semibold" style={{ color: qualityScore < 40 ? '#ef4444' : qualityScore > 70 ? '#10b981' : '#f59e0b' }}>
                                        {card.progress?.difficulty ? `${card.progress.difficulty.toFixed(1)} / 10` : 'N/A'}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-[color:var(--color-bg)] rounded-full overflow-hidden">
                                    <div className="h-full transition-[width] duration-300 ease-in-out" style={{ background: qualityScore < 40 ? '#ef4444' : qualityScore > 70 ? '#10b981' : '#f59e0b', width: `${card.progress?.difficulty ? (card.progress.difficulty / 10) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-[color:var(--color-text-muted)] uppercase font-bold tracking-wider">Stabilité</div>
                                    <div className="text-sm font-semibold text-[color:var(--color-drug)]">
                                        {card.progress?.stability ? `${card.progress.stability.toFixed(1)} j` : 'N/A'}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-[color:var(--color-bg)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[color:var(--color-drug)] transition-[width] duration-300 ease-in-out" style={{ width: `${Math.min(100, (card.progress?.stability || 0) / 365 * 100)}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-[color:var(--color-text-muted)] uppercase font-bold tracking-wider">Historique</div>
                                <div className="text-lg font-semibold text-[color:var(--color-text)] mt-1">
                                    {card.progress?.reps ?? 0} rép. <span className="text-[color:var(--color-text-muted)] text-sm font-normal">({card.progress?.lapses ?? 0} oublis)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`flip-card ${shouldReveal ? 'revealed' : ''}`}>
                        <div className="flip-card-inner">
                            {/* Front of Card (Question) */}
                            <div className={`flip-card-front custom-scrollbar shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${card.progress?.isLeech ? 'border-2 border-red-500' : 'border border-[color:var(--color-border)]'}`}>
                                {card.progress?.isLeech && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg py-3 px-4 text-red-500 flex items-start gap-3 mb-6 w-full max-w-[500px] mx-auto">
                                        <Brain size={24} weight="duotone" className="shrink-0 mt-0.5" />
                                        <div className="text-left">
                                            <div className="font-bold mb-1">Carte Difficile (Leech)</div>
                                            <div className="text-sm opacity-90">Vous bloquez souvent sur cette carte. Envisagez de la modifier pour la rendre plus simple ou de la décomposer.</div>
                                        </div>
                                    </div>
                                )}
                                <div className="text-center flex-1 flex flex-col justify-center">
                                    {card.format === 'cloze' ? (
                                        <div className="m-0 mb-2 text-[1.75rem] text-[color:var(--color-text)] font-medium leading-relaxed">
                                            {(card.content || '').split(/(\{.*?\}|\|\|.*?\|\|)/).map((part, i) => {
                                                if ((part.startsWith('{') && part.endsWith('}')) || (part.startsWith('||') && part.endsWith('||'))) {
                                                    return (
                                                        <span key={i} className="text-[color:var(--color-text-muted)] font-extrabold border-b-2 border-dashed border-[color:var(--color-border)] px-1 rounded bg-white/5">
                                                            [...]
                                                        </span>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="m-0 mb-2 text-3xl text-[color:var(--color-text)] font-bold">{card.title}</h3>
                                            {card.subtitle && <p className="text-[color:var(--color-text-muted)] m-0 text-xl font-mono">{card.subtitle}</p>}
                                        </>
                                    )}
                                </div>
                                
                                <div className="mt-auto flex flex-col items-center gap-4">
                                    <button 
                                        onClick={() => setIsAnswerRevealed(true)}
                                        className="bg-[color:var(--color-drug)] text-white border-none py-4 px-8 rounded-xl text-lg font-semibold cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-transform duration-200 hover:-translate-y-0.5 w-full max-w-[400px]"
                                    >
                                        Afficher la réponse
                                    </button>
                                    <div className="text-sm text-[color:var(--color-text-muted)] flex items-center gap-1.5">
                                        Appuyez sur <kbd className="bg-white/10 py-0.5 px-1.5 rounded border border-[color:var(--color-border)] font-mono font-semibold text-xs text-[color:var(--color-text)]">Espace</kbd> pour révéler
                                    </div>
                                </div>
                            </div>

                            {/* Back of Card (Answer) */}
                            <div className="flip-card-back custom-scrollbar border border-[color:var(--color-border)] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                                <div className="text-center mb-8">
                                    {card.format === 'cloze' ? (
                                        <div className="m-0 mb-2 text-[1.75rem] text-[color:var(--color-text)] font-medium leading-relaxed text-center">
                                            {(card.content || '').split(/(\{.*?\}|\|\|.*?\|\|)/).map((part, i) => {
                                                if ((part.startsWith('{') && part.endsWith('}')) || (part.startsWith('||') && part.endsWith('||'))) {
                                                    const clozeText = part.startsWith('{') ? part.slice(1, -1) : part.slice(2, -2);
                                                    return (
                                                        <span key={i} className="text-[color:var(--color-drug)] font-extrabold border-b-2 border-dashed border-[color:var(--color-drug)] px-1 rounded bg-[color:var(--color-drug-light)]">
                                                            {clozeText}
                                                        </span>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="m-0 mb-2 text-3xl text-[color:var(--color-text)] font-bold">{card.title}</h3>
                                            {card.subtitle && <p className="text-[color:var(--color-text-muted)] m-0 text-xl font-mono">{card.subtitle}</p>}
                                        </>
                                    )}
                                </div>

                                <div className="markdown-content flex-1">
                                    {card.content && card.format !== 'cloze' && (
                                        <div className={card.details ? 'mb-6' : 'mb-0'}>
                                            <MarkdownRenderer content={card.content} />
                                        </div>
                                    )}
                                    
                                    {card.details && (
                                        <div className="bg-white/5 p-5 rounded-xl border-l-4 border-l-[color:var(--color-drug)] mb-6">
                                            <div className="text-xs text-[color:var(--color-drug)] uppercase font-extrabold tracking-wider mb-2">Détails de la réponse</div>
                                            <MarkdownRenderer content={card.details} />
                                        </div>
                                    )}
                                    
                                    {linkedRecommendations.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-[color:var(--color-border)]">
                                            <div className="text-sm font-semibold text-[color:var(--color-text-muted)] mb-3 flex items-center gap-1.5">
                                                Parcours logique recommandé
                                            </div>
                                            <div className="links-list flex gap-2 flex-wrap">
                                                {linkedRecommendations.map(rec => (
                                                    <button key={rec.id} className="link-chip px-4 py-1.5 text-sm bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-full cursor-pointer text-[color:var(--color-text)] font-medium transition-all duration-200 hover:border-[color:var(--color-drug)]" onClick={() => onJumpToCard?.(rec.id)}>
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
                    <div className="py-5 px-6 bg-[color:var(--color-surface)] border-t border-[color:var(--color-border)] rounded-b-2xl animate-[slideUp_0.3s_ease-out]">
                        <div className="review-actions-container flex gap-3 justify-center max-w-[800px] mx-auto">
                            {(isCourseType ? COURSE_REVIEW_ACTIONS : REVIEW_ACTIONS)
                                .filter(action => showEasyButton || action.rating !== 4)
                                .map(action => (
                                <button
                                    key={action.rating}
                                    className={`review-action-btn ${action.className} flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-xl border-none cursor-pointer transition-all duration-100 shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:brightness-95 active:scale-95`}
                                    onClick={() => handleRate(action.rating)}
                                    title={`Raccourci clavier: ${action.rating}`}
                                >
                                    <div className="text-base font-bold mb-1">{action.label}</div>
                                    <div className="text-sm opacity-85 font-medium flex items-center gap-1">
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
