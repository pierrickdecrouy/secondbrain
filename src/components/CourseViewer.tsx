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
import { toast } from 'react-hot-toast';
import './styles/CourseViewer.css';

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
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
    const handlePrint = async () => {
        if (!window.electronAPI || !(window.electronAPI as any).generateCoursePdf) {
            const originalTitle = document.title;
            const date = new Date();
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = String(date.getFullYear()).slice(-2);
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            const safeCourseName = (course.title || 'SansTitre').replace(/[^a-zA-Z0-9À-ÿ]/g, '_').replace(/_+/g, '_').replace(/(^_|_$)/g, '');
            document.title = `Cours_${safeCourseName}_${d}${m}${y}_${hh}h${mm}_Extnd`;
            
            setTimeout(() => {
                window.print();
                document.title = originalTitle;
            }, 100);
            return;
        }

        try {
            setIsGeneratingPdf(true);
            const toastId = toast.loading('Génération du PDF en cours (LaTeX)...');
            
            const courseData = {
                title: course.title,
                description: course.subtitle || course.details || '',
                content: course.content,
                cards: conceptCards,
            };
            
            const result = await (window.electronAPI as any).generateCoursePdf(courseData);
            
            toast.dismiss(toastId);
            if (result && result.success) {
                toast.success('PDF généré avec succès !');
            } else if (!result || !result.canceled) {
                toast.error('Erreur lors de la génération du PDF.');
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Erreur: ${error.message || 'Échec de la génération'}`);
            console.error(error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const [now] = useState(() => Date.now());
    const updatedDate = new Date(course.updatedAt || now).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const headerElevated = scrollY > 8;

    return (
        <div className="courseviewer-style-1" >
            <div className="no-print courseviewer-style-2" >
            
            {/* ── Top Bar ─────────────────────────────────────────── */}
            <div className="courseviewer-style-3" style={{
  borderBottom: `1px solid ${headerElevated ? 'var(--color-border)' : 'transparent'}`
}}>
                {/* Back */}
                <button
                    onClick={onBack}
                    className="courseviewer-style-4" 
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
                <div className="courseviewer-style-5" >
                    {/* Add concept */}
                    {course.nodeType === 'course' && (
                        <button
                            onClick={onAddConcept}
                            title="Ajouter un concept"
                            className="courseviewer-style-6" 
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
                        className="courseviewer-style-7" 
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

                    <div className="courseviewer-style-8"  />

                    <button
                        onClick={handlePrint}
                        className="courseviewer-style-9" 
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-surface-hover)';
                            e.currentTarget.style.color = 'var(--color-text)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <Printer size={16} /> {isGeneratingPdf ? 'Génération...' : 'PDF'}
                    </button>

                    <button
                        onClick={onDelete}
                        className="courseviewer-style-10" 
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
                        className="courseviewer-style-11" 
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
                    <div className="courseviewer-style-12" style={{
  background: course.tags && course.tags.length > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(45,212,191,0.05) 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 100%)'
}}>
                        <div className="courseviewer-style-13"  />
                    </div>

                    <article className="courseviewer-style-14" style={{
  marginTop: -60
}}>
                        {/* Document header */}
                        <div className="courseviewer-style-15" >
                            <h1 className="courseviewer-style-16" >
                                {course.title}
                            </h1>

                            {/* Tags */}
                            {course.tags && course.tags.length > 0 && (
                                <div className="courseviewer-style-17" >
                                    {course.tags.map(t => (
                                        <span key={t} className="courseviewer-style-18" >
                                            <Hash size={12} weight="bold" /> {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Meta row */}
                            <div className="courseviewer-style-19" >
                                <div className="courseviewer-style-20" >
                                    <CalendarBlank size={15} /> Modifié le {updatedDate}
                                </div>
                                {conceptCards.length > 0 && (
                                    <div className="courseviewer-style-21" >
                                        <span className="courseviewer-style-22"  />
                                        {conceptCards.length} concept{conceptCards.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Prose */}
                        {(course.details || course.content) && (
                            <div className="prose-container courseviewer-style-23" >
                                <MarkdownRenderer content={course.details || course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                            </div>
                        )}

                        {/* Concepts rendering inline */}
                        {course.nodeType === 'course' && conceptCards.length > 0 && (
                            <div className="courseviewer-style-24" >
                                <h2 className="courseviewer-style-25" >
                                    <PresentationChart size={28} weight="duotone" className="text-indigo-500" />
                                    Concepts Clés
                                </h2>
                                <div className="courseviewer-style-26" >
                                    {conceptCards.map(concept => (
                                        <details key={concept.id} id={`concept-${concept.id}`} className="courseviewer-style-27"  open>
                                            <summary className="courseviewer-style-28" >
                                                <div className="courseviewer-style-29" style={{
  background: getCategoryColor(concept.type)
}} />
                                                <div className="courseviewer-style-30" >{concept.title}</div>
                                                <CaretDown size={20} color="var(--color-text-muted)" className="accordion-icon courseviewer-style-31"  />
                                            </summary>
                                            <div className="prose-container courseviewer-style-32" >
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
                    <div className="courseviewer-style-33" >
                        
                        {/* Sticky CTA Révision */}
                        {flashcardCards.length > 0 && onStartReview && (
                            <div className="sticky-cta">
                                <div>
                                    <div className="courseviewer-style-34" >
                                        Prêt à vous tester ?
                                    </div>
                                    <div className="courseviewer-style-35" >
                                        {flashcardCards.length} flashcard{flashcardCards.length > 1 ? 's' : ''} disponible{flashcardCards.length > 1 ? 's' : ''}.
                                    </div>
                                </div>
                                <button
                                    onClick={() => onStartReview(flashcardCards.map(f => f.id), `Révision — ${course.title}`)}
                                    className="courseviewer-style-36" 
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
                            <div className="courseviewer-style-37" >
                                <div className="courseviewer-style-38" >
                                    <h3 className="courseviewer-style-39" >
                                        Concepts liés
                                    </h3>
                                    <button
                                        onClick={onAddConcept}
                                        className="courseviewer-style-40" 
                                    >
                                        <Plus size={16} weight="bold" />
                                    </button>
                                </div>
                                <div className="courseviewer-style-41" >
                                    {conceptCards.map(concept => (
                                        <div
                                            key={concept.id}
                                            onClick={() => {
                                                const el = document.getElementById(`concept-${concept.id}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="courseviewer-style-42" 
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div className="courseviewer-style-43" style={{
  background: getCategoryColor(concept.type)
}} />
                                            <div className="courseviewer-style-44" >
                                                {concept.title}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditConcept?.(concept.id); }}
                                                className="courseviewer-style-45" 
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
                                <div className="courseviewer-style-46" >
                                    <h3 className="courseviewer-style-47" >
                                        Flashcards liées
                                    </h3>
                                    <div className="courseviewer-style-48" >
                                        {onBulkAddFlashcard && (
                                            <button
                                                onClick={onBulkAddFlashcard}
                                                className="courseviewer-style-49" 
                                                title="Ajout en masse"
                                            >
                                                <ListPlus size={16} weight="bold" />
                                            </button>
                                        )}
                                        <button
                                            onClick={onAddFlashcard}
                                            className="courseviewer-style-50" 
                                            title="Ajouter une flashcard"
                                        >
                                            <Plus size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                                <div className="courseviewer-style-51" >
                                    {flashcardCards.map(fc => (
                                        <div
                                            key={fc.id}
                                            onClick={() => onEditFlashcard?.(fc.id)}
                                            className="courseviewer-style-52" 
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div className="courseviewer-style-53" >
                                                <div className="courseviewer-style-54" >
                                                    {fc.format === 'cloze' ? 'Texte à trou' : fc.title}
                                                </div>
                                                <div className="courseviewer-style-55" style={{
  color: fc.progress?.status === 'review' ? '#ef4444' : fc.progress?.status === 'learning' ? '#f59e0b' : '#6366f1'
}}>
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
                            <div className="courseviewer-style-56" >
                                <PresentationChart size={28} weight="duotone" className="text-indigo-400 courseviewer-style-57"  />
                                <h3 className="courseviewer-style-58" >Aucune action</h3>
                                <p className="courseviewer-style-59" >
                                    Divisez ce cours en créant des concepts clés ou des flashcards.
                                </p>
                                <div className="courseviewer-style-60" >
                                    <button onClick={onAddConcept} className="courseviewer-style-61" >
                                        Lier un concept
                                    </button>
                                    <div className="courseviewer-style-62" >
                                        <button onClick={onAddFlashcard} className="courseviewer-style-63" >
                                            Flashcard
                                        </button>
                                        {onBulkAddFlashcard && (
                                            <button onClick={onBulkAddFlashcard} className="courseviewer-style-64" >
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
            <div className="print-only-course courseviewer-style-65" >
                <div className="print-header">
                    <h1 className="courseviewer-style-66" >
                        {course.title}
                    </h1>
                    <div className="courseviewer-style-67" >
                        {course.subtitle && <span className="courseviewer-style-68" >{course.subtitle}</span>}
                        Mise à jour le {updatedDate}
                    </div>
                </div>

                <div className="print-intro prose courseviewer-style-69" >
                    <MarkdownRenderer content={course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                </div>

                {conceptCards.length > 0 && (
                    <div className="print-concepts">
                        <h2 className="courseviewer-style-70" >Concepts Clés</h2>
                        {conceptCards.map(concept => (
                            <div key={concept.id} className="print-concept-item courseviewer-style-71" >
                                <h3 className="courseviewer-style-72" >
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
                        <div className="print-flashcards courseviewer-style-73" >
                            <h2 className="courseviewer-style-74" >Quiz (Questions)</h2>
                            <ul className="courseviewer-style-75" >
                                {flashcardCards.map((fc, index) => (
                                    <li key={`q-${fc.id}`} className="courseviewer-style-76" >
                                        <div className="courseviewer-style-77" >
                                            Question {index + 1}
                                        </div>
                                        <div className="courseviewer-style-78" >
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
                        
                        <div className="print-flashcards-answers courseviewer-style-79" >
                            <h2 className="courseviewer-style-80" >Corrigé du Quiz</h2>
                            <ul className="courseviewer-style-81" >
                                {flashcardCards.map((fc, index) => (
                                    <li key={`a-${fc.id}`} className="courseviewer-style-82" >
                                        <div className="courseviewer-style-83" >
                                            Réponse {index + 1}
                                        </div>
                                        <div className="courseviewer-style-84" >
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
