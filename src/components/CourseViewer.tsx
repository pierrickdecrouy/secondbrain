import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
    ArrowLeft, PencilSimple, Printer, Trash, CalendarBlank, Hash, Plus,
    PresentationChart, Brain,
} from '@phosphor-icons/react';
import { useCardStore } from '../store/useCardStore';

interface CourseViewerProps {
    course: Card;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddConcept?: () => void;
    onViewConcept?: (conceptId: string) => void;
    onEditConcept?: (conceptId: string) => void;
    onAddFlashcard?: () => void;
    onEditFlashcard?: (flashcardId: string) => void;
    onStartReview?: (cardIds: string[], title: string) => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
    course,
    onBack,
    onEdit,
    onDelete,
    onAddConcept,
    onViewConcept,
    onEditConcept,
    onAddFlashcard,
    onEditFlashcard,
    onStartReview,
}) => {
    const [scrollY, setScrollY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { cards } = useCardStore();

    const conceptCards = cards.filter(c => c.nodeType === 'concept' && c.parentId === course.id);
    const flashcardCards = cards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handle = () => setScrollY(el.scrollTop);
        el.addEventListener('scroll', handle, { passive: true });
        return () => el.removeEventListener('scroll', handle);
    }, []);

    const handleInternalLinkClick = (target: string) => {
        const targetCard = cards.find(c => c.title.trim().toLowerCase() === target.trim().toLowerCase());
        if (targetCard) {
            if (targetCard.nodeType === 'concept' && onViewConcept) {
                onViewConcept(targetCard.id);
            } else if (targetCard.nodeType === 'flashcard' && onEditFlashcard) {
                onEditFlashcard(targetCard.id);
            } else if (onEditConcept) {
                onEditConcept(targetCard.id);
            }
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        const date = new Date();
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const safeCourseName = (course.title || 'SansTitre').replace(/[^a-zA-Z0-9À-ÿ]/g, '_').replace(/_+/g, '_').replace(/(^_|_$)/g, '');
        document.title = `Cours_${safeCourseName}_${d}${m}${y}_${hh}h${mm}_Extnd`;
        
        // Timeout to allow the browser to register the document.title change before the print dialog opens
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 100);
    };

    const [now] = useState(() => Date.now());
    const updatedDate = new Date(course.updatedAt || now).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const headerElevated = scrollY > 8;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--color-bg)',
            overflow: 'hidden',
            margin: '0 -2rem -2rem -1rem',
        }}>
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ── Top Bar ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                height: 64,
                flexShrink: 0,
                background: 'var(--color-bg)',
                borderBottom: `1px solid ${headerElevated ? 'var(--color-border)' : 'transparent'}`,
                transition: 'border-color 0.2s ease',
                zIndex: 20,
            }}>
                {/* Back */}
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        fontSize: 14, fontWeight: 500,
                        padding: '8px 12px', borderRadius: 6,
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--color-surface-hover)';
                        e.currentTarget.style.color = 'var(--color-text)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                >
                    <ArrowLeft size={18} />
                    Retour
                </button>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Add concept — icône discrète */}
                    {course.nodeType === 'course' && (
                        <button
                            onClick={onAddConcept}
                            title="Ajouter un concept"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'none', border: 'none',
                                borderRadius: 6, padding: '8px 12px',
                                fontSize: 13, fontWeight: 500,
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer', transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-surface-hover)';
                                e.currentTarget.style.color = 'var(--color-text)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <Plus size={16} />
                            Concept
                        </button>
                    )}

                    {/* Add flashcard — icône discrète */}
                    <button
                        onClick={onAddFlashcard}
                        title="Créer une flashcard"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 12px',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-surface-hover)';
                            e.currentTarget.style.color = 'var(--color-text)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <Plus size={16} />
                        Flashcard
                    </button>

                    <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 12px',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-surface-hover)';
                            e.currentTarget.style.color = 'var(--color-text)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <Printer size={16} />
                        PDF
                    </button>

                    <button
                        onClick={onDelete}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 12px',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--color-text-muted)', cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <Trash size={16} />
                    </button>

                    <button
                        onClick={onEdit}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--color-primary)',
                            border: 'none',
                            borderRadius: 8, padding: '9px 18px',
                            fontSize: 14, fontWeight: 600,
                            color: '#fff', cursor: 'pointer',
                            transition: 'opacity 0.15s ease',
                            marginLeft: 4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <PencilSimple size={16} weight="fill" />
                        Modifier
                    </button>
                </div>
            </div>

            {/* ── Scrollable body ──────────────────────────────────── */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Cover Banner */}
                <div style={{
                    width: '100%',
                    height: 180,
                    background: course.tags && course.tags.length > 0
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(45,212,191,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 100%)',
                    flexShrink: 0,
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(0deg, var(--color-bg) 0%, transparent 100%)'
                    }} />
                </div>

                {/* Document Container */}
                <article style={{
                    width: '100%',
                    maxWidth: 960,
                    padding: '0 64px 80px',
                    marginTop: -60,
                    position: 'relative',
                    zIndex: 10,
                }}>

                    {/* Document header */}
                    <div style={{ marginBottom: 40 }}>
                        <h1 style={{
                            fontSize: 48,
                            fontWeight: 800,
                            letterSpacing: '-1.2px',
                            lineHeight: 1.1,
                            color: 'var(--color-text)',
                            margin: '0 0 20px 0',
                        }}>
                            {course.title}
                        </h1>

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                {course.tags.map(t => (
                                    <span key={t} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 13, fontWeight: 500,
                                        color: 'var(--color-text-muted)',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 6, padding: '4px 10px',
                                    }}>
                                        <Hash size={12} weight="bold" />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                <CalendarBlank size={15} />
                                Modifié le {updatedDate}
                            </div>
                            {flashcardCards.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                                    {flashcardCards.length} flashcard{flashcardCards.length > 1 ? 's' : ''}
                                </div>
                            )}
                            {conceptCards.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                                    {conceptCards.length} concept{conceptCards.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Concepts Clés (Premium Grid) ── */}
                    {course.nodeType === 'course' && conceptCards.length > 0 && (
                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <PresentationChart size={18} weight="duotone" className="text-indigo-500" />
                                    Concepts Clés
                                </h3>
                                <button
                                    onClick={onAddConcept}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        background: 'none', border: 'none',
                                        fontSize: 13, fontWeight: 600,
                                        color: '#6366f1', cursor: 'pointer',
                                    }}
                                >
                                    <Plus size={14} weight="bold" /> Ajouter
                                </button>
                            </div>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
                            }}>
                                {conceptCards.map(concept => (
                                    <button
                                        key={concept.id}
                                        onClick={() => onViewConcept ? onViewConcept(concept.id) : onEditConcept?.(concept.id)}
                                        className="glass-panel"
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                            padding: '16px', borderRadius: 16,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', marginBottom: 6, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {concept.title}
                                        </div>
                                        {concept.details && (
                                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {concept.details}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Content ── */}
                    {(course.details || course.content) && (
                        <div style={{
                            borderTop: '1px solid var(--color-border)',
                            paddingTop: 48,
                        }}>
                            <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text)' }}>
                                <MarkdownRenderer content={course.details || course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                            </div>
                        </div>
                    )}

                    {/* ── Flashcards rattachées (compact list) ── */}
                    {flashcardCards.length > 0 && (
                        <div style={{ marginTop: 64 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                                    Flashcards
                                    <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                        {flashcardCards.length}
                                    </span>
                                </h2>
                                <button
                                    onClick={onAddFlashcard}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        background: 'none', border: '1px solid var(--color-border)',
                                        borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500,
                                        color: 'var(--color-text-muted)', cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--color-surface)';
                                        e.currentTarget.style.color = 'var(--color-text)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                    }}
                                >
                                    <Plus size={14} /> Ajouter
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {flashcardCards.map(fc => (
                                    <div
                                        key={fc.id}
                                        onClick={() => onEditFlashcard?.(fc.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px',
                                            background: 'var(--color-surface)',
                                            borderRadius: 10, border: '1px solid var(--color-border)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Hash size={16} weight="bold" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {fc.format === 'cloze' ? 'Texte à trou' : fc.title}
                                            </div>
                                            {(fc.format === 'cloze' ? fc.content : fc.details) && (
                                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                                    {(fc.format === 'cloze' ? fc.content : fc.details)?.substring(0, 80)}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 8px',
                                            borderRadius: 6,
                                            background: fc.progress?.status === 'review' ? 'rgba(239,68,68,0.1)' : fc.progress?.status === 'learning' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                                            color: fc.progress?.status === 'review' ? '#ef4444' : fc.progress?.status === 'learning' ? '#f59e0b' : '#6366f1',
                                        }}>
                                            {fc.progress?.status === 'review' ? 'À réviser' : fc.progress?.status === 'learning' ? 'En cours' : 'Nouvelle'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Empty State ── */}
                    {course.nodeType === 'course' && conceptCards.length === 0 && flashcardCards.length === 0 && (
                        <div className="glass-panel" style={{
                            marginTop: 64, padding: '48px 32px', textAlign: 'center',
                            borderRadius: 24,
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}>
                            <div style={{ 
                                width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.05)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 
                            }}>
                                <PresentationChart size={32} weight="duotone" className="text-indigo-400" />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>Aucun contenu rattaché</h3>
                            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 0 32px 0', lineHeight: 1.6 }}>
                                Ce cours est encore vide. Créez des concepts clés pour l'enrichir ou ajoutez des flashcards pour vous tester.
                            </p>
                            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                                <button onClick={onAddConcept} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                                    <Plus size={18} weight="bold" /> Lier un concept
                                </button>
                                <button onClick={onAddFlashcard} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
                                    <Plus size={18} weight="bold" /> Créer une flashcard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── CTA Révision ── */}
                    {flashcardCards.length > 0 && onStartReview && (
                        <div style={{
                            marginTop: 56,
                            padding: '28px 32px',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(45,212,191,0.04) 100%)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                        }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text)', marginBottom: 6 }}>
                                    Prêt à vous tester ?
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    {flashcardCards.length} flashcard{flashcardCards.length > 1 ? 's' : ''} disponible{flashcardCards.length > 1 ? 's' : ''} pour réviser ce cours.
                                </div>
                            </div>
                            <button
                                onClick={() => onStartReview(flashcardCards.map(f => f.id), `Révision — ${course.title}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '14px 28px', borderRadius: 12,
                                    background: '#10b981', border: 'none',
                                    color: '#fff', fontWeight: 700, fontSize: 15,
                                    cursor: 'pointer', flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)';
                                }}
                            >
                                <Brain size={20} weight="fill" />
                                Réviser maintenant
                            </button>
                        </div>
                    )}
                </article>
            </div>
            </div>

            {/* ── Print Only Layout ────────────────────────────────── */}
            <div className="print-only-course" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', lineHeight: 1.4, fontSize: '11pt' }}>
                <div className="print-header">
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', fontFamily: 'var(--font-sans)', color: 'black' }}>
                        {course.title}
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '16px' }}>
                        {course.subtitle && <span style={{ marginRight: '16px' }}>{course.subtitle}</span>}
                        Mise à jour le {updatedDate}
                    </div>
                </div>

                <div className="print-intro prose" style={{ marginBottom: '20px' }}>
                    <MarkdownRenderer content={course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                </div>

                {conceptCards.length > 0 && (
                    <div className="print-concepts">
                        <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '16px' }}>Concepts Clés</h2>
                        {conceptCards.map(concept => (
                            <div key={concept.id} className="print-concept-item" style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'black', marginBottom: '8px' }}>
                                    {concept.title}
                                </h3>
                                <div className="prose">
                                    <MarkdownRenderer content={concept.details || ''} onInternalLinkClick={handleInternalLinkClick} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {flashcardCards.length > 0 && (
                    <>
                        <div className="print-flashcards" style={{ marginTop: '24px', pageBreakBefore: 'always' }}>
                            <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>Quiz (Questions)</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {flashcardCards.map((fc, index) => (
                                    <li key={`q-${fc.id}`} style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px dashed #ccc', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '1.05rem' }}>
                                            Question {index + 1}
                                        </div>
                                        <div style={{ marginBottom: '8px', fontSize: '1.05rem' }}>
                                            {fc.format === 'cloze' ? (
                                                <span dangerouslySetInnerHTML={{ __html: (fc.content || '').replace(/\{([^}]+)\}/g, '<strong>___________</strong>').replace(/\|\|([^|]+)\|\|/g, '<strong>___________</strong>') }} />
                                            ) : (
                                                fc.title
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="print-flashcards-answers" style={{ marginTop: '24px', pageBreakBefore: 'always' }}>
                            <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>Corrigé du Quiz</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {flashcardCards.map((fc, index) => (
                                    <li key={`a-${fc.id}`} style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>
                                            Réponse {index + 1}
                                        </div>
                                        <div style={{ color: '#333', fontSize: '1.05rem' }}>
                                            {fc.format === 'cloze' ? (
                                                <span dangerouslySetInnerHTML={{ __html: (fc.content || '').replace(/\{([^}]+)\}/g, '<strong style="color: black; text-decoration: underline">$1</strong>').replace(/\|\|([^|]+)\|\|/g, '<strong style="color: black; text-decoration: underline">$1</strong>') }} />
                                            ) : (
                                                <MarkdownRenderer content={fc.details || ''} onInternalLinkClick={handleInternalLinkClick} />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1cm; }
                    body { background: white !important; }
                    .prose, .prose * { color: black !important; }
                    h1, h2, h3, h4 { page-break-after: avoid; }
                    p, img, table { page-break-inside: avoid; }
                    img { max-width: 100% !important; }
                    .medical-alert { border: 1px solid #ccc !important; box-shadow: none !important; break-inside: avoid; }
                    .medical-alert-header { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
};
