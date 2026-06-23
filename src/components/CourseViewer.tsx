import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, PencilSimple, Printer, Trash, CalendarBlank, Hash } from '@phosphor-icons/react';

interface CourseViewerProps {
    course: Card;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
    course,
    onBack,
    onEdit,
    onDelete
}) => {
    const [scrollY, setScrollY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handle = () => setScrollY(el.scrollTop);
        el.addEventListener('scroll', handle, { passive: true });
        return () => el.removeEventListener('scroll', handle);
    }, []);

    const handlePrint = () => window.print();

    const updatedDate = new Date(course.updatedAt || Date.now()).toLocaleDateString('fr-FR', {
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
                padding: '0 28px',
                height: 56,
                flexShrink: 0,
                background: 'var(--color-surface)',
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
                        fontSize: 13, fontWeight: 600,
                        padding: '6px 10px', borderRadius: 8,
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
                    <ArrowLeft size={16} weight="bold" />
                    Cours
                </button>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: '1px solid var(--color-border)',
                            borderRadius: 8, padding: '6px 14px',
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
                        <Printer size={15} />
                        Exporter PDF
                    </button>

                    <button
                        onClick={onDelete}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none',
                            borderRadius: 8, padding: '6px 14px',
                            fontSize: 13, fontWeight: 500,
                            color: '#ef4444', cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                        }}
                    >
                        <Trash size={15} />
                        Supprimer
                    </button>

                    <button
                        onClick={onEdit}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: '#10b981',
                            border: 'none',
                            borderRadius: 8, padding: '7px 16px',
                            fontSize: 13, fontWeight: 600,
                            color: '#fff', cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
                    >
                        <PencilSimple size={15} weight="bold" />
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
                    justifyContent: 'center',
                    padding: '48px 40px 80px',
                }}
            >
                {/* Document card */}
                <article style={{
                    width: '100%',
                    maxWidth: 880,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                }}>
                    {/* Cover band — accent line at top */}
                    <div style={{
                        height: 4,
                        background: course.tags && course.tags.length > 0
                            ? 'linear-gradient(90deg, #10b981, #2dd4bf)'
                            : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    }} />

                    {/* Document header */}
                    <div style={{ padding: '40px 56px 32px' }}>

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                                {course.tags.map(t => (
                                    <span key={t} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 11, fontWeight: 600,
                                        color: '#10b981',
                                        background: 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                        borderRadius: 6, padding: '3px 9px',
                                        letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}>
                                        <Hash size={9} weight="bold" />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h1 style={{
                            fontSize: 34,
                            fontWeight: 800,
                            letterSpacing: '-0.8px',
                            lineHeight: 1.2,
                            color: 'var(--color-text)',
                            margin: '0 0 20px 0',
                        }}>
                            {course.title}
                        </h1>

                        {/* Meta row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            paddingTop: 16,
                            borderTop: '1px solid var(--color-border)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                <CalendarBlank size={14} />
                                Mise à jour le {updatedDate}
                            </div>
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div style={{
                        padding: '0 56px 56px',
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: 36,
                    }}>
                        <div style={{ fontSize: 15.5, lineHeight: 1.8, color: 'var(--color-text)' }}>
                            <MarkdownRenderer content={course.details || course.content || ''} />
                        </div>
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
