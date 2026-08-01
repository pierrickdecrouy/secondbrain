import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X, ChartBar, Coffee, Brain, Timer, BookBookmark, Stack, Pill, Heartbeat, Waveform, Database, Tag } from '@phosphor-icons/react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { calculateFsrsProgress } from '../algorithms/fsrs';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useTheme } from '../context/ThemeContext';
import './ReviewSessionModal.css';

export type CategoryType = 'drug' | 'patho' | 'physio' | 'data';
export type CardMode = 'flashcard' | 'course';

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
    { rating: 1, label: 'Je dois relire', className: 'review-btn-1' },
    { rating: 3, label: 'J\'ai compris, suivant', className: 'review-btn-3' }
];

const LIGHT_THEME_MAP: Record<string, { bubble: string, text: string, bg: string, tag: string }> = {
    drug: { bubble: 'bg-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50', tag: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    patho: { bubble: 'bg-red-100', text: 'text-red-600', bg: 'bg-red-50', tag: 'bg-red-100 text-red-700 border border-red-200' },
    physio: { bubble: 'bg-indigo-100', text: 'text-indigo-600', bg: 'bg-indigo-50', tag: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
    data: { bubble: 'bg-orange-100', text: 'text-orange-600', bg: 'bg-orange-50', tag: 'bg-orange-100 text-orange-700 border border-orange-200' }
};

const DARK_THEME_MAP: Record<string, { bubble: string, text: string, bg: string, tag: string }> = {
    drug: { bubble: 'bg-emerald-900/30', text: 'text-emerald-400', bg: 'bg-emerald-400/5', tag: 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20' },
    patho: { bubble: 'bg-red-900/30', text: 'text-red-400', bg: 'bg-red-400/5', tag: 'bg-red-400/10 text-red-400 border border-red-500/20' },
    physio: { bubble: 'bg-indigo-900/30', text: 'text-indigo-400', bg: 'bg-indigo-400/5', tag: 'bg-indigo-400/10 text-indigo-400 border border-indigo-500/20' },
    data: { bubble: 'bg-orange-900/30', text: 'text-orange-400', bg: 'bg-orange-400/5', tag: 'bg-orange-400/10 text-orange-400 border border-orange-500/20' }
};

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
    const { darkMode } = useTheme();
    const [index, setIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(false);
    
    const [showEasyButton, setShowEasyButton] = useState(false);
    
    useEffect(() => {
        try {
            const raw = localStorage.getItem('pharmabrain_srs_settings');
            if (raw) {
                const settings = JSON.parse(raw);
                setShowEasyButton(!!settings.showEasyButton);
            }
        } catch (e) {}
    }, []);

    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(title === 'Quiz Express' ? 30 : null);

    // Reset stopwatch on new card
    useEffect(() => {
        setTimeSpent(0);
        setIsAnswerRevealed(false);
        setShowStats(false);
    }, [index]);

    // Track time spent answering (count up)
    useEffect(() => {
        if (isPaused || isAnswerRevealed) return;
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaused, isAnswerRevealed]);

    // Quiz Express countdown logic
    useEffect(() => {
        if (quizTimeLeft === null || isPaused) return;
        if (quizTimeLeft <= 0) {
            setIsAnswerRevealed(true);
            return;
        }
        const timer = setInterval(() => {
            setQuizTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
        return () => clearInterval(timer);
    }, [quizTimeLeft, isPaused]);

    const card = cards[index];

    const allCardsMap = useMemo(() => {
        const map = new Map<string, Card>();
        allCards.forEach(c => map.set(c.id, c));
        return map;
    }, [allCards]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const linkedRecommendations = useMemo(() => {
        if (!card || card.nodeType !== 'flashcard') return [];
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

    const isCourseType = card?.nodeType === 'course' || card?.nodeType === 'concept';
    const shouldReveal = isAnswerRevealed || isCourseType;

    const nextIntervals = useMemo(() => {
        if (!card) return { 1: '', 2: '', 3: '', 4: '' };
        return {
            1: formatInterval(calculateFsrsProgress(card.progress, 1, isCourseType).dueDate),
            2: formatInterval(calculateFsrsProgress(card.progress, 2, isCourseType).dueDate),
            3: formatInterval(calculateFsrsProgress(card.progress, 3, isCourseType).dueDate),
            4: formatInterval(calculateFsrsProgress(card.progress, 4, isCourseType).dueDate),
        };
    }, [card, isCourseType]);

    const handleRate = useCallback((rating: 1 | 2 | 3 | 4) => {
        if (!card || !shouldReveal) return;
        onRate(card.id, rating);
        if (index < cards.length - 1) {
            setIndex(prev => prev + 1);
            setIsAnswerRevealed(false);
        } else {
            handleClose();
        }
    }, [card, index, cards.length, onRate, shouldReveal, handleClose]);

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
                else if (e.key === '2' && !isCourseType) handleRate(2);
                else if (e.key === '3') handleRate(3);
                else if (e.key === '4' && showEasyButton && !isCourseType) handleRate(4);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRate, shouldReveal, handleClose, isPaused, isCourseType, showEasyButton]);

    const modalRef = useFocusTrap(true);

    if (!card) return null;

    const qualityScore = card.progress?.difficulty ? (10 - card.progress.difficulty) * 10 : 50;
    const progressPercent = ((index + 1) / cards.length) * 100;

    const category = ((card as any).category || 'drug') as CategoryType;
    const themeMap = darkMode ? DARK_THEME_MAP : LIGHT_THEME_MAP;
    const theme = themeMap[category] || themeMap.drug;

    const getCategoryIcon = (cat: string, type: string) => {
        if (type === 'course') return <BookBookmark size={22} weight="bold" />;
        switch(cat.toLowerCase()) {
            case 'drug': return <Pill size={22} weight="bold" />;
            case 'patho': return <Heartbeat size={22} weight="bold" />;
            case 'physio': return <Waveform size={22} weight="bold" />;
            case 'data': return <Database size={22} weight="bold" />;
            default: return <Tag size={22} weight="bold" />;
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div
            className={`review-modal-overlay ${darkMode ? 'dark' : 'light'}`}
            aria-modal="true"
            role="dialog"
        >
            <div 
                ref={modalRef} 
                className={`review-modal-container ${darkMode ? 'dark' : 'light'}`}
            >
                {/* Category Color Bubble (Top Right) */}
                <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] ${theme.bubble} rounded-full z-0 pointer-events-none transition-colors duration-500 blur-[100px] opacity-60`}></div>

                <div className="relative z-10 flex flex-col h-full overflow-hidden">
                    {/* Header Toolbar */}
                    <div className="review-modal-header">
                        <div className="flex items-center gap-3">
                            <div className={`${theme.text}`}>
                                <Brain size={26} weight="duotone" />
                            </div>
                            <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'} tracking-tight flex items-center gap-3 m-0`}>
                                {title || 'Révision planifiée (FSRS)'}
                            </h2>
                            {title === 'Bachotage Intensif' && (
                                <span className={`hidden sm:inline-block ml-2 text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Mode Entraînement
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 md:gap-5">
                            {/* Timer Display */}
                            {quizTimeLeft !== null ? (
                                <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all border ${quizTimeLeft <= 10 ? "bg-red-50 border-red-200 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : (darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500")}`}>
                                    <Timer size={16} weight={quizTimeLeft <= 10 ? "bold" : "duotone"} />
                                    <span className="font-mono tracking-wide">{quizTimeLeft}s</span>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                                    <Timer size={16} weight="duotone" />
                                    <span className="font-mono tracking-wide">{formatTime(timeSpent)}</span>
                                </div>
                            )}

                            <div className={`hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 text-base font-bold tracking-wide border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <Stack size={18} weight="duotone" />
                                {index + 1} <span className="opacity-50 mx-1">/</span> {cards.length}
                            </div>

                            <div className={`w-px h-6 mx-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setShowStats(!showStats)} 
                                    className={`p-2.5 rounded-xl transition-colors border-none outline-none flex items-center justify-center ${showStats ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')}`}
                                    title="Statistiques de la carte"
                                >
                                    <ChartBar size={22} weight={showStats ? "fill" : "regular"} />
                                </button>
                                <button 
                                    onClick={() => setIsPaused(!isPaused)} 
                                    className={`p-2.5 rounded-xl transition-colors border-none outline-none flex items-center justify-center ${isPaused ? (darkMode ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600') : (darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')}`}
                                    title="Faire une pause"
                                >
                                    <Coffee size={22} weight={isPaused ? "fill" : "regular"} />
                                </button>
                                <button 
                                    onClick={handleClose} 
                                    className={`p-2.5 rounded-xl transition-colors border-none outline-none flex items-center justify-center ml-2 ${darkMode ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-600'}`}
                                    title="Fermer"
                                >
                                    <X size={24} weight="bold" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar (slim) */}
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
                        <div 
                            className={`h-full bg-emerald-500 transition-all duration-500 ${darkMode ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`}
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    {/* Main Content Area */}
                    <div className={`review-modal-content-area ${isCourseType ? 'custom-scrollbar' : '!overflow-hidden'}`}>
                        {isPaused ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 overflow-y-auto custom-scrollbar">
                                <div className={`w-24 h-24 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-50'} flex items-center justify-center mb-6 shadow-sm`}>
                                    <Coffee size={48} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                                </div>
                                <h3 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Session en pause</h3>
                                <p className={`max-w-lg text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-12 leading-relaxed`}>
                                    Prenez votre temps. La science prouve que de courtes pauses améliorent la rétention mnésique.
                                </p>
                                
                                {/* FSRS Stats integrated in Pause Screen */}
                                <div className={`w-full max-w-xl mb-12 p-8 rounded-[32px] border shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-[0.2em] mb-8 flex items-center justify-center gap-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <ChartBar size={20} /> Statistiques FSRS
                                    </h4>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className={`text-xs uppercase font-semibold tracking-wider mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Stabilité</div>
                                            <div className={`font-mono text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{card.progress?.stability?.toFixed(1) || '0.0'}</div>
                                            <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>jours</div>
                                        </div>
                                        <div className={`text-center border-l border-r ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                            <div className={`text-xs uppercase font-semibold tracking-wider mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Difficulté</div>
                                            <div className={`font-mono text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{qualityScore.toFixed(0)}%</div>
                                            <div className="px-6 mt-3">
                                                <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${qualityScore}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-xs uppercase font-semibold tracking-wider mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Historique</div>
                                            <div className={`font-mono text-3xl font-extrabold flex items-center justify-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                                <span className="text-emerald-500">{card.progress?.reps || 0}</span>
                                                <span className={`text-xl opacity-30`}>/</span>
                                                <span className="text-red-500">{card.progress?.lapses || 0}</span>
                                            </div>
                                            <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>révs / oublis</div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setIsPaused(false)}
                                    className="px-12 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold shadow-xl shadow-emerald-500/30 transition-all active:scale-95 border-none outline-none cursor-pointer"
                                >
                                    Reprendre la révision
                                </button>
                            </div>
                        ) : (
                            <div className={`flex-1 flex flex-col max-w-4xl w-full mx-auto justify-center ${!isCourseType ? 'items-center' : ''} px-4 sm:px-12`}>
                                {/* Top Tag (Absolute in Top Corner) */}
                                <div className="absolute top-6 left-6 md:top-8 md:left-10">
                                    <span className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-extrabold tracking-[0.15em] uppercase shadow-sm border ${theme.tag}`}>
                                        {getCategoryIcon(category, card.type)}
                                        {card.type}
                                    </span>
                                </div>

                                {/* Question Area */}
                                <div className="w-full text-center transition-all duration-500 z-10 mb-16 mt-12">
                                    <h3 className={`m-0 text-3xl md:text-5xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                                    {card.subtitle && <p className={`mt-6 mb-0 text-xl md:text-2xl font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.subtitle}</p>}
                                </div>

                                {/* Answer Area */}
                                <div className={`w-full transition-all duration-500 transform ${shouldReveal ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none hidden'}`}>
                                    {card.content && card.format !== 'cloze' && (
                                        <div className={`prose prose-lg md:prose-xl max-w-none text-center leading-relaxed ${darkMode ? 'prose-invert' : ''} ${card.details ? 'mb-16' : 'mb-0'}`}>
                                            <MarkdownRenderer content={card.content} />
                                        </div>
                                    )}
                                    
                                    {card.details && (
                                        <div className={`p-10 sm:p-12 rounded-[32px] border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'} mb-16 shadow-sm`}>
                                            <div className={`text-sm uppercase font-extrabold tracking-[0.2em] mb-8 flex items-center gap-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                <Brain size={26} weight="duotone" />
                                                Détails de la réponse
                                            </div>
                                            <div className={`prose prose-base md:prose-lg max-w-none leading-relaxed ${darkMode ? 'prose-invert' : ''}`}>
                                                <MarkdownRenderer content={card.details} />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {linkedRecommendations.length > 0 && (
                                        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                            <div className={`text-sm font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Parcours logique recommandé
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {linkedRecommendations.map(rec => (
                                                    <button 
                                                        key={rec.id} 
                                                        className={`px-4 py-1.5 text-sm rounded-full cursor-pointer font-medium transition-all duration-200 outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600'}`} 
                                                        onClick={() => onJumpToCard?.(rec.id)}
                                                    >
                                                        {rec.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Panel (Overlay) */}
                    {showStats && !isPaused && (
                        <div className={`absolute right-8 top-8 w-64 p-5 rounded-2xl border shadow-xl z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Statistiques (FSRS)</h4>
                            <div className="space-y-3">
                                <div>
                                    <div className={`text-xs mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Stabilité mnésique</div>
                                    <div className={`font-mono text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{card.progress?.stability?.toFixed(2) || '0.00'} jours</div>
                                </div>
                                <div>
                                    <div className={`text-xs mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Difficulté intrinsèque</div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${qualityScore}%` }}></div>
                                        </div>
                                        <div className={`font-mono text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{qualityScore.toFixed(0)}%</div>
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-xs mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Historique</div>
                                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{card.progress?.reps || 0} révisions, {card.progress?.lapses || 0} oublis</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="review-modal-footer">
                        {!shouldReveal && !isPaused ? (
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setIsAnswerRevealed(true)}
                                    className={`w-full max-w-md py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 border-none outline-none cursor-pointer ${darkMode ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'}`}
                                >
                                    Révéler la réponse
                                </button>
                            </div>
                        ) : shouldReveal && !isPaused ? (
                            <div className="flex justify-center flex-col items-center">
                                <div className="flex w-full max-w-2xl gap-3 sm:gap-4 flex-col sm:flex-row">
                                    {(isCourseType ? COURSE_REVIEW_ACTIONS : REVIEW_ACTIONS)
                                        .map(action => (
                                        <button
                                            key={action.rating}
                                            className={`review-action-btn ${action.className}`}
                                            onClick={() => handleRate(action.rating)}
                                        >
                                            <div className="text-[15px] mb-1">{action.label}</div>
                                            <div className="text-[12px] font-medium opacity-80">
                                                {nextIntervals[action.rating]}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className={`mt-5 text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Utilisez les touches {isCourseType ? '1, 3' : '1, 2, 3, 4'}
                                </div>
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>
        </div>
    );
};
