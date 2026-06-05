import React from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, PencilSimple, Printer, Trash } from '@phosphor-icons/react';
import './CourseEditor.css'; // For medical-alert styling

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
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="course-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
            {/* Header / Nav */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', zIndex: 10 }}>
                <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    <ArrowLeft size={20} />
                    Retour
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        <Printer size={20} />
                        Exporter en PDF
                    </button>
                    <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        <Trash size={20} />
                        Supprimer
                    </button>
                    <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0369a1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(3,105,161,0.2)' }}>
                        <PencilSimple size={20} />
                        Modifier
                    </button>
                </div>
            </div>

            <div className="course-viewer-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' }}>
                {/* Print area container */}
                <div className="course-print-area" style={{ width: '100%', maxWidth: '1000px', backgroundColor: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '48px', color: 'var(--color-text)' }}>
                    
                    {/* Meta */}
                    <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.2 }}>{course.title}</h1>
                        {course.tags && course.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {course.tags.map(t => (
                                    <span key={t} style={{ backgroundColor: 'var(--color-bg)', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Dernière mise à jour: {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="course-markdown-content" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
                        <MarkdownRenderer content={course.details || course.content || ''} />
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1.5cm; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .course-viewer { background: white !important; display: block !important; height: auto !important; overflow: visible !important; }
                    .course-viewer-scroll-area { overflow: visible !important; padding: 0 !important; display: block !important; }
                    .course-print-area { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; max-width: none !important; color: black !important; }
                    
                    /* Typography for print */
                    .course-markdown-content { color: black !important; }
                    h1, h2, h3, h4 { page-break-after: avoid; color: black !important; }
                    p, img, table { page-break-inside: avoid; }
                    img { max-width: 100% !important; }
                    
                    /* Medical alerts in print */
                    .medical-alert { border: 1px solid #ccc !important; box-shadow: none !important; break-inside: avoid; }
                    .medical-alert-header { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
};
