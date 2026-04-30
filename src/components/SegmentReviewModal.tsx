import React, { useState, useMemo } from 'react';
import { X, BookOpen, CheckCircle2, RotateCcw, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import type { CardSegment, UserCardProgress } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { calculateSrsData } from '../algorithms/srs';
import { updateSegmentProgress, loadSegmentProgress } from '../storage';

interface SegmentReviewModalProps {
    segments: CardSegment[];
    cardTitle: string;
    onClose: () => void;
    onProgressUpdate?: (segmentId: string, progress: UserCardProgress) => void;
}

const RATING_LABELS: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Oublié', color: '#dc2626', bg: '#fef2f2' },
    2: { label: 'Difficile', color: '#d97706', bg: '#fffbeb' },
    3: { label: 'Bien', color: '#2563eb', bg: '#eff6ff' },
    4: { label: 'Facile', color: '#16a34a', bg: '#f0fdf4' },
};

const statusColors: Record<string, string> = {
    new: '#94a3b8',
    learning: '#f59e0b',
    review: '#3b82f6',
    suspended: '#ef4444',
};

export const SegmentReviewModal: React.FC<SegmentReviewModalProps> = ({
    segments,
    cardTitle,
    onClose,
    onProgressUpdate,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [progressMap, setProgressMap] = useState<Record<string, UserCardProgress>>(
        () => loadSegmentProgress()
    );
    const [ratedSegments, setRatedSegments] = useState<Set<string>>(new Set());

    const current = segments[currentIndex];

    const currentProgress = current ? progressMap[current.id] : undefined;

    const statusLabel: Record<string, string> = {
        new: 'Nouveau',
        learning: 'En cours',
        review: 'À réviser',
        suspended: 'Suspendu',
    };

    const handleRate = (rating: 1 | 2 | 3 | 4) => {
        if (!current) return;
        const result = calculateSrsData(currentProgress ?? null, rating);
        const newProgress: UserCardProgress = {
            status: result.status,
            step: result.step,
            dueDate: result.dueDate,
            interval: result.interval,
            easeFactor: result.easeFactor,
            lapses: result.lapses,
            isLeech: result.isLeech,
            lastReview: new Date().toISOString(),
        };

        setProgressMap(prev => ({ ...prev, [current.id]: newProgress }));
        updateSegmentProgress(current.id, newProgress);
        onProgressUpdate?.(current.id, newProgress);

        setRatedSegments(prev => new Set(prev).add(current.id));
        setShowAnswer(false);

        // Move to next segment
        if (currentIndex < segments.length - 1) {
            setCurrentIndex(i => i + 1);
        }
    };

    const completedCount = ratedSegments.size;
    const progress = segments.length > 0 ? (completedCount / segments.length) * 100 : 0;

    if (!current) {
        return (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '48px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '90vw',
                }}>
                    <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                        Session terminée !
                    </h3>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Vous avez révisé {completedCount} section{completedCount !== 1 ? 's' : ''}.
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 24px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        );
    }

    const isDone = ratedSegments.has(current.id);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '90vw',
                maxWidth: '680px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <BookOpen size={20} color="#6366f1" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                            {cardTitle}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                            Micro-Learning · Section {currentIndex + 1}/{segments.length}
                        </div>
                    </div>
                    {currentProgress && (
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: `${statusColors[currentProgress.status] ?? '#94a3b8'}18`,
                            color: statusColors[currentProgress.status] ?? '#94a3b8',
                            border: `1px solid ${statusColors[currentProgress.status] ?? '#94a3b8'}40`,
                        }}>
                            {statusLabel[currentProgress.status]}
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress bar */}
                <div style={{ height: '4px', background: '#f1f5f9' }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        transition: 'width 0.4s ease',
                    }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <h3 style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span style={{
                            background: '#ede9fe',
                            color: '#6d28d9',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            §
                        </span>
                        {current.title}
                    </h3>

                    {showAnswer ? (
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            <MarkdownRenderer content={current.content} />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.9rem' }}>
                                Pouvez-vous vous rappeler le contenu de cette section ?
                            </p>
                            <button
                                onClick={() => setShowAnswer(true)}
                                style={{
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '12px 32px',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Voir la réponse
                            </button>
                        </div>
                    )}
                </div>

                {/* Rating buttons */}
                {showAnswer && !isDone && (
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                    }}>
                        {([1, 2, 3, 4] as const).map(rating => {
                            const { label, color, bg } = RATING_LABELS[rating];
                            return (
                                <button
                                    key={rating}
                                    onClick={() => handleRate(rating)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 8px',
                                        borderRadius: '10px',
                                        border: `1.5px solid ${color}30`,
                                        background: bg,
                                        color,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
                                    onMouseOut={e => { e.currentTarget.style.filter = 'none'; }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Navigation footer */}
                <div style={{
                    padding: '12px 24px',
                    borderTop: showAnswer && !isDone ? 'none' : '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <button
                        onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setShowAnswer(false); }}
                        disabled={currentIndex === 0}
                        style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                            opacity: currentIndex === 0 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            color: '#475569',
                        }}
                    >
                        <ChevronLeft size={14} /> Précédent
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {completedCount}/{segments.length} évalué{completedCount !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={() => { setCurrentIndex(i => Math.min(segments.length - 1, i + 1)); setShowAnswer(false); }}
                        disabled={currentIndex === segments.length - 1}
                        style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            cursor: currentIndex === segments.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: currentIndex === segments.length - 1 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            color: '#475569',
                        }}
                    >
                        Suivant <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
