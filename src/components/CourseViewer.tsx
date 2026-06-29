import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, PencilSimple, Printer, Trash, CalendarBlank, Hash, Plus, PresentationChart } from '@phosphor-icons/react';
import { useCardStore } from '../store/useCardStore';

interface CourseViewerProps {
    course: Card;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddConcept?: () => void;
    onEditConcept?: (conceptId: string) => void;
    onAddFlashcard?: () => void;
    onEditFlashcard?: (flashcardId: string) => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
    course,
    onBack,
    onEdit,
    onDelete,
    onAddConcept,
    onEditConcept,
    onAddFlashcard,
    onEditFlashcard
}) => {
    const [scrollY, setScrollY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { cards } = useCardStore();

    const conceptCards = cards.filter(c => c.nodeType === 'concept' && c.parentId === course.id);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handle = () => setScrollY(el.scrollTop);
        el.addEventListener('scroll', handle, { passive: true });
        return () => el.removeEventListener('scroll', handle);
    }, []);

    const handlePrint = () => window.print();

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 14px',
                            fontSize: 14, fontWeight: 500,
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
                        <Printer size={18} />
                        Exporter PDF
                    </button>

                    <button
                        onClick={onDelete}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 6, padding: '8px 14px',
                            fontSize: 14, fontWeight: 500,
                            color: 'var(--color-text-muted)', cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <Trash size={18} />
                        Supprimer
                    </button>

                    <button
                        onClick={onEdit}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--color-primary)',
                            border: 'none',
                            borderRadius: 6, padding: '8px 16px',
                            fontSize: 14, fontWeight: 500,
                            color: '#fff', cursor: 'pointer',
                            transition: 'opacity 0.15s ease',
                            marginLeft: 4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <PencilSimple size={18} weight="fill" />
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
                {/* Cover Banner spans the whole width */}
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
                    maxWidth: 960, // slightly widened as requested
                    padding: '0 64px 100px',
                    marginTop: -60, // overlap with banner
                    position: 'relative',
                    zIndex: 10,
                }}>

                    {/* Document header */}
                    <div style={{ marginBottom: 40 }}>
                        {/* Title */}
                        <h1 style={{
                            fontSize: 48,
                            fontWeight: 800,
                            letterSpacing: '-1.2px',
                            lineHeight: 1.1,
                            color: 'var(--color-text)',
                            margin: '0 0 24px 0',
                        }}>
                            {course.title}
                        </h1>

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                <CalendarBlank size={16} />
                                Dernière modification le {updatedDate}
                            </div>
                        </div>
                    </div>

                    {/* ── Content ── */}
                    {(course.details || course.content) && (
                        <div style={{
                            borderTop: '1px solid var(--color-border)',
                            paddingTop: 48,
                        }}>
                            <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text)' }}>
                                <MarkdownRenderer content={course.details || course.content || ''} />
                            </div>
                        </div>
                    )}

                    {/* ── Concepts ou Flashcards Associés ── */}
                    <div style={{ marginTop: 64 }}>
                        {course.nodeType === 'course' ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Concepts Clés</h2>
                                    <button
                                        onClick={onAddConcept}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                            borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600,
                                            color: 'var(--color-text)', cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <Plus size={16} /> Ajouter un Concept
                                    </button>
                                </div>

                                {conceptCards.length === 0 ? (
                                    <div style={{
                                        padding: 40, textAlign: 'center', background: 'var(--color-surface)',
                                        borderRadius: 12, border: '1px dashed var(--color-border)',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        Aucun concept clé rattaché à ce cours. <br/>
                                        Ajoutez des concepts (ex: Définitions, Traitements, Symptômes) pour mieux structurer la connaissance.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {conceptCards.map(concept => (
                                            <div key={concept.id} 
                                                onClick={() => onEditConcept?.(concept.id)}
                                                style={{
                                                display: 'flex', alignItems: 'center', gap: 16,
                                                padding: 16, background: 'var(--color-surface)',
                                                borderRadius: 12, border: '1px solid var(--color-border)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: 'var(--shadow)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                            >
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <PresentationChart size={20} weight="fill" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{concept.title}</h3>
                                                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                        Dernière modif : {new Date(concept.updatedAt || 0).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Flashcards</h2>
                                    <button
                                        onClick={onAddFlashcard}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                            borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600,
                                            color: 'var(--color-text)', cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <Plus size={16} /> Créer une Flashcard
                                    </button>
                                </div>

                                {cards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id).length === 0 ? (
                                    <div style={{
                                        padding: 40, textAlign: 'center', background: 'var(--color-surface)',
                                        borderRadius: 12, border: '1px dashed var(--color-border)',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        Aucune flashcard rattachée à ce concept. <br/>
                                        Ajoutez des questions ou des textes à trous pour réviser plus tard.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {cards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id).map(fc => (
                                            <div key={fc.id} 
                                                onClick={() => onEditFlashcard?.(fc.id)}
                                                style={{
                                                display: 'flex', alignItems: 'center', gap: 16,
                                                padding: 16, background: 'var(--color-surface)',
                                                borderRadius: 12, border: '1px solid var(--color-border)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: 'var(--shadow)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                            >
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Hash size={20} weight="fill" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{fc.format === 'cloze' ? 'Texte à trou' : fc.title}</h3>
                                                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                        {fc.format === 'cloze' ? fc.content?.substring(0, 50) + '...' : fc.details?.substring(0, 50) + '...'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </article>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1.5cm; }
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
