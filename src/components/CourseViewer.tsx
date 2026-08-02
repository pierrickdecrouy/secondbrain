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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" >
            <div className="no-print flex flex-col h-full" >
            
            {/* ── Top Bar ─────────────────────────────────────────── */}
            <div className={`flex items-center justify-between px-6 h-16 shrink-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 z-20 border-b ${headerElevated ? 'border-slate-200 dark:border-slate-800' : 'border-transparent'}`}>
                {/* Back */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-slate-500 font-medium text-sm px-3 py-2 rounded-md transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100" 
                    
                    
                >
                    <ArrowLeft size={18} />
                    Retour
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1.5" >
                    {/* Add concept */}
                    {course.nodeType === 'course' && (
                        <button
                            onClick={onAddConcept}
                            title="Ajouter un concept"
                            className="flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100" 
                            
                            
                        >
                            <Plus size={16} /> Concept
                        </button>
                    )}

                    {/* Add flashcard */}
                    <button
                        onClick={onAddFlashcard}
                        title="Créer une flashcard"
                        className="flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100" 
                        
                        
                    >
                        <Plus size={16} /> Flashcard
                    </button>

                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"  />

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100" 
                        
                        
                    >
                        <Printer size={16} /> {isGeneratingPdf ? 'Génération...' : 'PDF'}
                    </button>

                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-red-50 hover:dark:bg-red-900/20 hover:text-red-500" 
                        
                        
                    >
                        <Trash size={16} />
                    </button>

                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 bg-teal-600 dark:bg-teal-500 border-none rounded-lg px-4.5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-opacity duration-150 ml-1 hover:opacity-90" 
                        
                        
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
                    <div className="w-full h-[180px] shrink-0 relative" style={{
  background: course.tags && course.tags.length > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(45,212,191,0.05) 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 100%)'
}}>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent"  />
                    </div>

                    <article className="w-full max-w-[760px] px-10 pb-20 relative z-10 -mt-[60px]">
                        {/* Document header */}
                        <div className="mb-10" >
                            <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-100 mb-5" >
                                {course.title}
                            </h1>

                            {/* Tags */}
                            {course.tags && course.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-5" >
                                    {course.tags.map(t => (
                                        <span key={t} className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1" >
                                            <Hash size={12} weight="bold" /> {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Meta row */}
                            <div className="flex items-center gap-4" >
                                <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium" >
                                    <CalendarBlank size={15} /> Modifié le {updatedDate}
                                </div>
                                {conceptCards.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium" >
                                        <span className="w-[3px] h-[3px] rounded-full bg-slate-500"  />
                                        {conceptCards.length} concept{conceptCards.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Prose */}
                        {(course.details || course.content) && (
                            <div className="prose-container text-base leading-relaxed text-slate-900 dark:text-slate-100" >
                                <MarkdownRenderer content={course.details || course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                            </div>
                        )}

                        {/* Concepts rendering inline */}
                        {course.nodeType === 'course' && conceptCards.length > 0 && (
                            <div className="mt-12 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-10" >
                                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3" >
                                    <PresentationChart size={28} weight="duotone" className="text-indigo-500" />
                                    Concepts Clés
                                </h2>
                                <div className="flex flex-col gap-10" >
                                    {conceptCards.map(concept => (
                                        <details key={concept.id} id={`concept-${concept.id}`} className="scroll-mt-[100px] group"  open>
                                            <summary className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3 cursor-pointer outline-none select-none list-none [&::-webkit-details-marker]:hidden" >
                                                <div className="w-3 h-3 rounded-full" style={{
  background: getCategoryColor(concept.type)
}} />
                                                <div className="flex-1" >{concept.title}</div>
                                                <CaretDown size={20} color="var(--color-text-muted)" className="accordion-icon transition-transform duration-200 group-open:rotate-180"  />
                                            </summary>
                                            <div className="prose-container text-base leading-relaxed text-slate-900 dark:text-slate-100" >
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
                    <div className="p-6" >
                        
                        {/* Sticky CTA Révision */}
                        {flashcardCards.length > 0 && onStartReview && (
                            <div className="sticky-cta">
                                <div>
                                    <div className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1" >
                                        Prêt à vous tester ?
                                    </div>
                                    <div className="text-[13px] text-slate-500" >
                                        {flashcardCards.length} flashcard{flashcardCards.length > 1 ? 's' : ''} disponible{flashcardCards.length > 1 ? 's' : ''}.
                                    </div>
                                </div>
                                <button
                                    onClick={() => onStartReview(flashcardCards.map(f => f.id), `Révision — ${course.title}`)}
                                    className="flex items-center justify-center gap-2 w-full p-3 rounded-xl mt-4 bg-emerald-500 border-none text-white font-bold text-sm cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)]" 
                                    
                                    
                                >
                                    <Brain size={18} weight="fill" />
                                    Réviser maintenant
                                </button>
                            </div>
                        )}

                        {/* Concepts List Sidebar */}
                        {conceptCards.length > 0 && (
                            <div className="mb-8" >
                                <div className="flex justify-between items-center mb-4" >
                                    <h3 className="text-base font-bold m-0 text-slate-900 dark:text-slate-100" >
                                        Concepts liés
                                    </h3>
                                    <button
                                        onClick={onAddConcept}
                                        className="bg-transparent border-none text-slate-500 cursor-pointer p-1" 
                                    >
                                        <Plus size={16} weight="bold" />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2" >
                                    {conceptCards.map(concept => (
                                        <div
                                            key={concept.id}
                                            onClick={() => {
                                                const el = document.getElementById(`concept-${concept.id}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-150 hover:border-teal-500" 
                                            
                                            
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{
  background: getCategoryColor(concept.type)
}} />
                                            <div className="flex-1 min-w-0 font-semibold text-[13px] text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap" >
                                                {concept.title}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditConcept?.(concept.id); }}
                                                className="bg-transparent border-none p-1 cursor-pointer text-slate-500 opacity-60 hover:opacity-100 hover:text-teal-500" 
                                                
                                                
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
                            <div className={flashcardCards.length > 0 ? 'mt-0' : 'mt-6'}>
                                <div className="flex justify-between items-center mb-4" >
                                    <h3 className="text-base font-bold m-0 text-slate-900 dark:text-slate-100" >
                                        Flashcards liées
                                    </h3>
                                    <div className="flex gap-1" >
                                        {onBulkAddFlashcard && (
                                            <button
                                                onClick={onBulkAddFlashcard}
                                                className="bg-transparent border-none text-slate-500 cursor-pointer p-1" 
                                                title="Ajout en masse"
                                            >
                                                <ListPlus size={16} weight="bold" />
                                            </button>
                                        )}
                                        <button
                                            onClick={onAddFlashcard}
                                            className="bg-transparent border-none text-slate-500 cursor-pointer p-1" 
                                            title="Ajouter une flashcard"
                                        >
                                            <Plus size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2" >
                                    {flashcardCards.map(fc => (
                                        <div
                                            key={fc.id}
                                            onClick={() => onEditFlashcard?.(fc.id)}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-150 hover:border-teal-500" 
                                            
                                            
                                        >
                                            <div className="flex-1 min-w-0" >
                                                <div className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap" >
                                                    {fc.format === 'cloze' ? 'Texte à trou' : fc.title}
                                                </div>
                                                <div className={`text-[11px] font-semibold mt-1 ${fc.progress?.status === 'review' ? 'text-red-500' : fc.progress?.status === 'learning' ? 'text-amber-500' : 'text-indigo-500'}`}>
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
                            <div className="p-8 px-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center" >
                                <PresentationChart size={28} weight="duotone" className="text-indigo-400 mb-4"  />
                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 m-0 mb-2" >Aucune action</h3>
                                <p className="text-[13px] text-slate-500 m-0 mb-6 leading-relaxed" >
                                    Divisez ce cours en créant des concepts clés ou des flashcards.
                                </p>
                                <div className="flex flex-col gap-2.5 w-full" >
                                    <button onClick={onAddConcept} className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-[13px] cursor-pointer border-none" >
                                        Lier un concept
                                    </button>
                                    <div className="flex gap-2" >
                                        <button onClick={onAddFlashcard} className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[13px] cursor-pointer" >
                                            Flashcard
                                        </button>
                                        {onBulkAddFlashcard && (
                                            <button onClick={onBulkAddFlashcard} className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[13px] cursor-pointer" >
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
            <div className="print-only-course font-sans leading-[1.4] text-[11pt]" >
                <div className="print-header">
                    <h1 className="text-[2rem] font-extrabold m-0 mb-1 font-sans text-black" >
                        {course.title}
                    </h1>
                    <div className="text-[0.9rem] text-[#555] mb-4" >
                        {course.subtitle && <span className="mr-4" >{course.subtitle}</span>}
                        Mise à jour le {updatedDate}
                    </div>
                </div>

                <div className="print-intro prose mb-5" >
                    <MarkdownRenderer content={course.content || ''} onInternalLinkClick={handleInternalLinkClick} />
                </div>

                {conceptCards.length > 0 && (
                    <div className="print-concepts">
                        <h2 className="text-[1.5rem] border-b border-black pb-1 m-0 mb-4" >Concepts Clés</h2>
                        {conceptCards.map(concept => (
                            <div key={concept.id} className="print-concept-item mb-4 break-inside-avoid" >
                                <h3 className="text-[1.2rem] text-black m-0 mb-2" >
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
                        <div className="print-flashcards mt-6 break-before-page" >
                            <h2 className="text-[1.5rem] border-b border-black pb-1 m-0 mb-4 font-sans" >Quiz (Questions)</h2>
                            <ul className="list-none p-0" >
                                {flashcardCards.map((fc, index) => (
                                    <li key={`q-${fc.id}`} className="mb-4 pb-2 border-b border-dashed border-[#ccc] break-inside-avoid" >
                                        <div className="font-bold m-0 mb-1 text-[1.05rem]" >
                                            Question {index + 1}
                                        </div>
                                        <div className="m-0 mb-2 text-[1.05rem]" >
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
                        
                        <div className="print-flashcards-answers mt-6 break-before-page" >
                            <h2 className="text-[1.5rem] border-b border-black pb-1 m-0 mb-4 font-sans" >Corrigé du Quiz</h2>
                            <ul className="list-none p-0" >
                                {flashcardCards.map((fc, index) => (
                                    <li key={`a-${fc.id}`} className="mb-4 pb-2 border-b border-[#eee] break-inside-avoid" >
                                        <div className="font-bold m-0 mb-1 text-[#555]" >
                                            Réponse {index + 1}
                                        </div>
                                        <div className="text-[#333] text-[1.05rem]" >
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
