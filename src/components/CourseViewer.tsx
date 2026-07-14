import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
    ArrowLeft, PencilSimple, Printer, Trash, CalendarBlank, Hash, Plus,
    PresentationChart, Brain, CaretDown, ListPlus
} from '@phosphor-icons/react';
import { useCardStore } from '../store/useCardStore';
import { useTheme } from '../context/ThemeContext';
import DOMPurify from 'dompurify';

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
    onBulkAddFlashcard?: () => void;
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
    onBulkAddFlashcard,
    onEditFlashcard,
    onStartReview,
}) => {
    const { cards } = useCardStore();
    const { getCategoryColor } = useTheme();
    const [scrollY, setScrollY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

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
                    {/* Add concept */}
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
                            <Plus size={16} /> Concept
                        </button>
                    )}

                    {/* Add flashcard */}
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
                        <Plus size={16} /> Flashcard
                    </button>

                    <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 12px',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.15s ease',
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
                        <Printer size={16} /> PDF
                    </button>

                    <button
                        onClick={onDelete}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 12px',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.15s ease',
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
                            background: 'var(--color-primary)', border: 'none',
                            borderRadius: 8, padding: '9px 18px',
                            fontSize: 14, fontWeight: 600,
                            color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s ease', marginLeft: 4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <PencilSimple size={16} weight="fill" /> Modifier
                    </button>
                </div>
            </div>

            {/* ── Split Layout: Context vs Action ────────────────── */}
            <div className="course-split-layout">
                
                {/* ── Left Pane (Prose & Concepts) ──────────────── */}
                <div ref={scrollRef} className="course-left-pane">
                    
                    {/* Cover Banner */}
                    <div style={{
                        width: '100%', height: 180, flexShrink: 0, position: 'relative',
                        background: course.tags && course.tags.length > 0
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(45,212,191,0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 100%)',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(0deg, var(--color-bg) 0%, transparent 100%)'
                        }} />
                    </div>

                    <article style={{
                        width: '100%', maxWidth: 760, padding: '0 40px 80px',
                        marginTop: -60, position: 'relative', zIndex: 10,
                    }}>
                        {/* Document header */}
                        <div style={{ marginBottom: 40 }}>
                            <h1 style={{
                                fontSize: 48, fontWeight: 800, letterSpacing: '-1.2px', lineHeight: 1.1,
                                color: 'var(--color-text)', margin: '0 0 20px 0',
                            }}>
                                {course.title}
                            </h1>

                            {/* Tags */}
                            {course.tags && course.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                    {course.tags.map(t => (
                                        <span key={t} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)',
                                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                            borderRadius: 6, padding: '4px 10px',
                                        }}>
                                            <Hash size={12} weight="bold" /> {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Meta row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    <CalendarBlank size={15} /> Modifié le {updatedDate}
                                </div>
                                {conceptCards.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                                        {conceptCards.length} concept{conceptCards.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Prose */}
                        {(course.details || course.content) && (
                            <div className="prose-container" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text)' }}>
                                <MarkdownRenderer content={course.details || course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                            </div>
                        )}

                        {/* Concepts rendering inline */}
                        {course.nodeType === 'course' && conceptCards.length > 0 && (
                            <div style={{ marginTop: 48, borderTop: '2px dashed var(--color-border)', paddingTop: 40 }}>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <PresentationChart size={28} weight="duotone" className="text-indigo-500" />
                                    Concepts Clés
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                                    {conceptCards.map(concept => (
                                        <details key={concept.id} id={`concept-${concept.id}`} style={{ scrollMarginTop: 100 }} open>
                                            <summary style={{
                                                fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16,
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                cursor: 'pointer', outline: 'none', listStyle: 'none', userSelect: 'none'
                                            }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: getCategoryColor(concept.type) }} />
                                                <div style={{ flex: 1 }}>{concept.title}</div>
                                                <CaretDown size={20} color="var(--color-text-muted)" className="accordion-icon" style={{ transition: 'transform 0.2s ease' }} />
                                            </summary>
                                            <div className="prose-container" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text)' }}>
                                                <MarkdownRenderer content={concept.details || concept.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                </div>

                {/* ── Right Pane (Sidebar / Action) ─────────────── */}
                <div className="course-right-pane">
                    <div style={{ padding: '24px' }}>
                        
                        {/* Sticky CTA Révision */}
                        {flashcardCards.length > 0 && onStartReview && (
                            <div className="sticky-cta">
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)', marginBottom: 4 }}>
                                        Prêt à vous tester ?
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                        {flashcardCards.length} flashcard{flashcardCards.length > 1 ? 's' : ''} disponible{flashcardCards.length > 1 ? 's' : ''}.
                                    </div>
                                </div>
                                <button
                                    onClick={() => onStartReview(flashcardCards.map(f => f.id), `Révision — ${course.title}`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        width: '100%', padding: '12px', borderRadius: 10, marginTop: 16,
                                        background: '#10b981', border: 'none',
                                        color: '#fff', fontWeight: 700, fontSize: 14,
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                                    }}
                                >
                                    <Brain size={18} weight="fill" />
                                    Réviser maintenant
                                </button>
                            </div>
                        )}

                        {/* Concepts List Sidebar */}
                        {conceptCards.length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                                        Concepts liés
                                    </h3>
                                    <button
                                        onClick={onAddConcept}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                                    >
                                        <Plus size={16} weight="bold" />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {conceptCards.map(concept => (
                                        <div
                                            key={concept.id}
                                            onClick={() => {
                                                const el = document.getElementById(`concept-${concept.id}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '12px',
                                                background: 'var(--color-bg)',
                                                borderRadius: 10, border: '1px solid var(--color-border)',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCategoryColor(concept.type) }} />
                                            <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {concept.title}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditConcept?.(concept.id); }}
                                                style={{
                                                    background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                                                    color: 'var(--color-text-muted)', opacity: 0.6
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                                                title="Modifier le concept"
                                            >
                                                <PencilSimple size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flashcards List */}
                        {flashcardCards.length > 0 && (
                            <div style={{ marginTop: flashcardCards.length > 0 ? 0 : 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                                        Flashcards liées
                                    </h3>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {onBulkAddFlashcard && (
                                            <button
                                                onClick={onBulkAddFlashcard}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                                                title="Ajout en masse"
                                            >
                                                <ListPlus size={16} weight="bold" />
                                            </button>
                                        )}
                                        <button
                                            onClick={onAddFlashcard}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                                            title="Ajouter une flashcard"
                                        >
                                            <Plus size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {flashcardCards.map(fc => (
                                        <div
                                            key={fc.id}
                                            onClick={() => onEditFlashcard?.(fc.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '12px',
                                                background: 'var(--color-bg)',
                                                borderRadius: 10, border: '1px solid var(--color-border)',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {fc.format === 'cloze' ? 'Texte à trou' : fc.title}
                                                </div>
                                                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: fc.progress?.status === 'review' ? '#ef4444' : fc.progress?.status === 'learning' ? '#f59e0b' : '#6366f1' }}>
                                                    {fc.progress?.status === 'review' ? 'À réviser' : fc.progress?.status === 'learning' ? 'En cours' : 'Nouvelle'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State Sidebar */}
                        {course.nodeType === 'course' && conceptCards.length === 0 && flashcardCards.length === 0 && (
                            <div style={{
                                padding: '32px 24px', textAlign: 'center',
                                borderRadius: 16, background: 'var(--color-bg)',
                                border: '1px dashed var(--color-border)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                <PresentationChart size={28} weight="duotone" className="text-indigo-400" style={{ marginBottom: 16 }} />
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>Aucune action</h3>
                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                                    Divisez ce cours en créant des concepts clés ou des flashcards.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                    <button onClick={onAddConcept} style={{ padding: '10px', borderRadius: 8, background: '#e0e7ff', color: '#4f46e5', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none' }}>
                                        Lier un concept
                                    </button>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={onAddFlashcard} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                            Flashcard
                                        </button>
                                        {onBulkAddFlashcard && (
                                            <button onClick={onBulkAddFlashcard} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                                En masse
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* ── Print Only Layout ────────────────────────────────── */}
            <div className="print-only-course" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', lineHeight: 1.4, fontSize: '11pt' }}>
                <div className="print-header">
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'var(--font-sans)', color: 'black' }}>
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
                        <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 16px 0' }}>Concepts Clés</h2>
                        {conceptCards.map(concept => (
                            <div key={concept.id} className="print-concept-item" style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'black', margin: '0 0 8px 0' }}>
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
                            <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 16px 0', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>Quiz (Questions)</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {flashcardCards.map((fc, index) => (
                                    <li key={`q-${fc.id}`} style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px dashed #ccc', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '1.05rem' }}>
                                            Question {index + 1}
                                        </div>
                                        <div style={{ margin: '0 0 8px 0', fontSize: '1.05rem' }}>
                                            {fc.format === 'cloze' ? (
                                                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((fc.content || '').replace(/\{([^}]+)\}/g, '<strong>___________</strong>').replace(/\|\|([^|]+)\|\|/g, '<strong>___________</strong>')) }} />
                                            ) : (
                                                fc.title
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="print-flashcards-answers" style={{ marginTop: '24px', pageBreakBefore: 'always' }}>
                            <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 16px 0', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>Corrigé du Quiz</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {flashcardCards.map((fc, index) => (
                                    <li key={`a-${fc.id}`} style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 'bold', margin: '0 0 4px 0', color: '#555' }}>
                                            Réponse {index + 1}
                                        </div>
                                        <div style={{ color: '#333', fontSize: '1.05rem' }}>
                                            {fc.format === 'cloze' ? (
                                                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((fc.content || '').replace(/\{([^}]+)\}/g, '<strong style="color: black; text-decoration: underline">$1</strong>').replace(/\|\|([^|]+)\|\|/g, '<strong style="color: black; text-decoration: underline">$1</strong>')) }} />
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

            {/* Layout Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                .course-split-layout {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                    flex-direction: row;
                }
                .course-left-pane {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 0;
                }
                .course-right-pane {
                    width: 350px;
                    flex-shrink: 0;
                    border-left: 1px solid var(--color-border);
                    background: var(--color-surface);
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }
                .sticky-cta {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    margin-bottom: 32px;
                    padding: 20px;
                    background: rgba(255,255,255,0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                
                /* HTML Details element styles */
                details.concepts-accordion summary::-webkit-details-marker {
                    display: none;
                }
                details[open] > summary .accordion-icon {
                    transform: rotate(180deg);
                }
                
                /* Dark mode adjustments */
                html.dark .sticky-cta {
                    background: rgba(30,41,59,0.7);
                }

                @media (max-width: 900px) {
                    .course-split-layout {
                        flex-direction: column;
                        overflow-y: auto; /* main scroll */
                    }
                    .course-left-pane {
                        overflow-y: visible;
                        flex: none;
                    }
                    .course-right-pane {
                        width: 100%;
                        border-left: none;
                        border-top: 1px solid var(--color-border);
                        overflow-y: visible;
                    }
                    .sticky-cta {
                        position: relative; /* remove sticky on mobile to save space */
                    }
                }

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
