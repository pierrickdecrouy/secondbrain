import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash, ListDashes, SquaresFour, FileText, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { stripMarkdown } from '../utils';
import { FullCourseEditor } from './FullCourseEditor';
import { CourseViewer } from './CourseViewer';
import { AddDataModal } from './AddDataModal';
import { DetailModal } from './DetailModal';
import { useCardStore as useCards } from '../store/useCardStore';
// import { exportDeckToJson } from '../utils/deckExport';
// import { importDeckFromJson } from '../utils/deckImport';

interface CoursesPageProps {
    onPause?: (draft: Partial<Card>) => void;
    initialDraft?: Card | null;
    onDraftConsumed?: () => void;
    onStartReview?: (cardIds: string[], title: string) => void;
}

// Color palette per subject group (bg bar color, text color for icon)
/* 
const GROUP_COLORS = [
    { bar: '#10b981', icon: '#10b981' }, // emerald
    { bar: '#a855f7', icon: '#a855f7' }, // purple
    { bar: '#3b82f6', icon: '#3b82f6' }, // blue
    { bar: '#f43f5e', icon: '#f43f5e' }, // rose
    { bar: '#f59e0b', icon: '#f59e0b' }, // amber
    { bar: '#06b6d4', icon: '#06b6d4' }, // cyan
];
*/

export const CoursesPage: React.FC<CoursesPageProps> = ({
    initialDraft,
    onDraftConsumed,
    onStartReview,
}) => {
    const { cards, handleSaveCard: onSaveCourse, handleDeleteCard: onDeleteCourse } = useCards();
    const existingCards = cards;
    const courseCards = useMemo(() => cards.filter(c => c.nodeType === 'course').sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), [cards]);
    const [editingCourse, setEditingCourse] = useState<Card | null>(null);
    const [viewingCourse, setViewingCourse] = useState<Card | null>(null);
    const [viewingConcept, setViewingConcept] = useState<Card | null>(null);
    const [editingFlashcard, setEditingFlashcard] = useState<Card | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isBulkAddingFlashcards, setIsBulkAddingFlashcards] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    // const now = Date.now();
    
    // const fileInputRef = React.useRef<HTMLInputElement>(null);

    /*
    const handleImportDeck = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const importedCards = await importDeckFromJson(file);
            // handleBatchImport already updates the store and Firebase
            useCards.getState().handleBatchImport(importedCards);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
        }
    };
    */

    // Resume draft
    React.useEffect(() => {
        if (initialDraft) {
            setEditingCourse(initialDraft);
            setIsCreating(!initialDraft.title);
            onDraftConsumed?.();
        }
    }, [initialDraft, onDraftConsumed]);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        courseCards.forEach(c => {
            if (c.tags) c.tags.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [courseCards]);

    const getCourseProgress = (courseId: string) => {
        const courseFlashcards = cards.filter(c => c.nodeType === 'flashcard' && c.parentId === courseId);
        if (courseFlashcards.length === 0) return null;
        const reviewed = courseFlashcards.filter(c => c.progress && c.progress.status !== 'new').length;
        return {
            total: courseFlashcards.length,
            reviewed,
            percentage: Math.round((reviewed / courseFlashcards.length) * 100)
        };
    };

    // Filter courses by tag + search
    const filteredCourses = useMemo(() => {
        let result = courseCards;
        if (selectedTag) result = result.filter(c => c.tags?.includes(selectedTag));
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.subject || '').toLowerCase().includes(q)
            );
        }
        return result.sort((a, b) => {
            const subjectA = a.subject || 'ZZZ';
            const subjectB = b.subject || 'ZZZ';
            if (subjectA !== subjectB) {
                return subjectA.localeCompare(subjectB);
            }
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
    }, [courseCards, selectedTag, search]);

    // Group by subject for list view
    /*
    const groupedCourses = useMemo(() => {
        const groups: Record<string, Card[]> = {};
        filteredCourses.forEach(c => {
            const subject = c.subject && c.subject.trim() !== '' ? c.subject : 'Général';
            if (!groups[subject]) groups[subject] = [];
            groups[subject].push(c);
        });
        
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Général') return 1;
            if (b === 'Général') return -1;
            return a.localeCompare(b);
        });

        return { groups, sortedKeys };
    }, [filteredCourses]);
    */

    const handleCreate = () => {
        setIsCreating(true);
        setEditingCourse({
            id: generateId(),
            type: COURSE_TYPE, // Maintained for backward compat, but nodeType is the source of truth
            nodeType: 'course',
            title: '',
            subtitle: '',
            content: '',
            details: '',
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    const handleEdit = (course: Card) => {
        setIsCreating(false);
        setViewingCourse(null);
        setEditingCourse(course);
    };

    const handleView = (course: Card) => {
        setViewingCourse(course);
    };

    const handleSave = (updatedCourse: Card) => {
        onSaveCourse({
            ...updatedCourse,
            updatedAt: Date.now()
        });
    };

    if (editingCourse) {
        return (
            <FullCourseEditor
                course={editingCourse}
                onSave={handleSave}
                onCancel={() => {
                    const wasCourse = viewingCourse && editingCourse.id === viewingCourse.id;
                    setEditingCourse(null);
                    setIsCreating(false);
                    if (!isCreating && wasCourse) {
                        setViewingCourse(editingCourse);
                    }
                }}
                existingCards={existingCards}
            />
        );
    }

    if (viewingCourse) {
        return (
            <>
            <CourseViewer
                course={viewingCourse}
                onBack={() => setViewingCourse(null)}
                onEdit={() => handleEdit(viewingCourse)}
                onDelete={() => {
                    onDeleteCourse(viewingCourse);
                    setViewingCourse(null);
                }}
                onAddConcept={() => {
                    setIsCreating(true);
                    setEditingCourse({
                        id: generateId(),
                        type: viewingCourse.type || 'drug', // inherit subject or default
                        nodeType: 'concept',
                        parentId: viewingCourse.id,
                        title: '',
                        subtitle: '',
                        content: '',
                        details: '',
                        tags: viewingCourse.tags || [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                }}
                onViewConcept={(conceptId) => {
                    const concept = cards.find(c => c.id === conceptId);
                    if (concept) {
                        setViewingConcept(concept);
                    }
                }}
                onEditConcept={(conceptId) => {
                    const concept = cards.find(c => c.id === conceptId);
                    if (concept) {
                        setIsCreating(false);
                        setEditingCourse(concept);
                    }
                }}
                onAddFlashcard={() => {
                    setEditingFlashcard({
                        id: generateId(),
                        type: viewingCourse.type || 'drug', // inherit category
                        nodeType: 'flashcard',
                        parentId: viewingCourse.id,
                        title: '',
                        subtitle: '',
                        content: '',
                        details: '',
                        format: 'q&a',
                        tags: viewingCourse.tags || [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                }}
                onBulkAddFlashcard={() => setIsBulkAddingFlashcards(true)}
                onEditFlashcard={(flashcardId) => {
                    const fc = cards.find(c => c.id === flashcardId);
                    if (fc) setEditingFlashcard(fc);
                }}
                onStartReview={onStartReview}
            />
            
            {editingFlashcard && (
                <AddDataModal
                    mode={editingFlashcard.id.startsWith('flashcard-') && !editingFlashcard.title ? 'create' : 'edit'}
                    card={editingFlashcard}
                    existingCards={existingCards}
                    onSave={(c) => {
                        onSaveCourse(c);
                        setEditingFlashcard(null);
                    }}
                    onClose={() => setEditingFlashcard(null)}
                    onImport={() => {}}
                    layout="modal"
                />
            )}
            
            {isBulkAddingFlashcards && (
                <AddDataModal
                    mode="import"
                    existingCards={existingCards}
                    onSave={(c) => onSaveCourse(c)}
                    onImport={(importedCards) => {
                        importedCards.forEach(c => {
                             if (!c.parentId && viewingCourse) {
                                  c.parentId = viewingCourse.id;
                                  c.nodeType = 'flashcard'; // ensure they are flashcards
                             }
                             onSaveCourse(c);
                        });
                        setIsBulkAddingFlashcards(false);
                    }}
                    onClose={() => setIsBulkAddingFlashcards(false)}
                    layout="modal"
                />
            )}
            
            {viewingConcept && (
                <DetailModal
                    card={viewingConcept}
                    allCards={cards}
                    onClose={() => setViewingConcept(null)}
                    onLinkClick={() => {}} // Navigation to other concepts from here not needed in this view, but could be added
                    actions={
                        <div className="modal-actions">
                            <button
                                className="btn-icon"
                                onClick={() => {
                                    setViewingConcept(null);
                                    setIsCreating(false);
                                    setEditingCourse(viewingConcept);
                                }}
                                title="Modifier"
                            >
                                <PencilSimple size={18} />
                            </button>
                        </div>
                    }
                />
            )}
            </>
        );
    }

    return (
        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans pb-12 overflow-y-auto" style={{ display: "flex", justifyContent: "center", padding: "2rem", width: "100%" }}>
            <main className="max-w-6xl mx-auto px-6 pt-10" style={{ maxWidth: "1152px", width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
                {/* En-tête de la page Cours */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white" style={{ fontWeight: 600 }}>Mes Fiches de Cours</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Gérez et révisez vos synthèses de cours structurées.</p>
                    </div>
                    
                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Vue Toggle */}
                        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm" style={{ display: 'flex' }}>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors border-none cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent'}`}
                                style={{ padding: '0.5rem', borderRadius: '0.375rem' }}
                            >
                                <SquaresFour size={20} weight="fill" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors border-none cursor-pointer ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent'}`}
                                style={{ padding: '0.5rem', borderRadius: '0.375rem' }}
                            >
                                <ListDashes size={20} weight="fill" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-600 transition-all shadow-emerald-200 border-none cursor-pointer"
                            style={{ padding: '0.625rem 1.5rem', borderRadius: '0.75rem' }}
                        >
                            <Plus size={18} weight="bold" />
                            Nouveau Cours
                        </button>
                    </div>
                </div>

                {/* Filtres et Recherche */}
                <div className="flex flex-col md:flex-row gap-4 mb-8" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un cours..." 
                            className="w-full bg-white dark:bg-slate-800 rounded-xl pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm text-slate-700 dark:text-white" 
                            style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', fontWeight: 400 }}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ display: 'flex', gap: '0.75rem', scrollbarWidth: 'none', alignItems: 'center' }}>
                        <button 
                            onClick={() => setSelectedTag(null)}
                            className={`px-5 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap transition-colors border-none cursor-pointer ${selectedTag === null ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                            style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px' }}
                        >
                            Tous ({courseCards.length})
                        </button>
                        {allTags.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`px-5 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap transition-colors border-none cursor-pointer ${selectedTag === tag ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                                    style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px' }}
                                >
                                    {tag}
                                </button>
                        ))}
                    </div>
                </div>

                {/* Grille de Cours */}
                <div style={{ display: viewMode === 'grid' ? "grid" : "flex", flexDirection: viewMode === 'grid' ? undefined : "column", gap: viewMode === 'grid' ? "1.5rem" : "1rem", gridTemplateColumns: viewMode === 'grid' ? "repeat(auto-fill, minmax(320px, 1fr))" : undefined }}>
                    {filteredCourses.map((course) => {
                        const prog = getCourseProgress(course.id);
                        const isActive = prog && prog.percentage > 0;
                        const elapsed = Math.round((Date.now() - (course.updatedAt || Date.now())) / (1000 * 60 * 60));
                        
                        return (
                            <div 
                                key={course.id}
                                onClick={() => handleView(course)}
                                className={`group bg-white dark:bg-slate-800 rounded-2xl shadow-sm relative overflow-hidden cursor-pointer flex transition-all ${isActive ? 'border-2 border-emerald-500' : 'border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'}`} style={{ padding: viewMode === "list" ? "0.75rem 1.25rem" : "1.25rem 1.5rem", flexDirection: viewMode === "list" ? "row" : "column", alignItems: viewMode === "list" ? "center" : "stretch", gap: viewMode === "list" ? "1.5rem" : "0", height: viewMode === "list" ? "auto" : "100%", borderWidth: isActive ? '1.5px' : '1px' }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                                
                                <div className={`flex ${viewMode === 'list' ? 'items-center' : 'justify-between items-start'} mb-4`} style={{ display: 'flex', alignItems: viewMode === 'list' ? 'center' : 'flex-start', justifyContent: viewMode === 'list' ? 'flex-start' : 'space-between', marginBottom: viewMode === 'list' ? '0' : '1rem' }}>
                                    <div className={`${viewMode === 'list' ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl'} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0`}>
                                        <BookOpen size={viewMode === 'list' ? 20 : 24} weight="fill" />
                                    </div>
                                    {viewMode === 'grid' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                            className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                                        >
                                            <Trash size={20} />
                                        </button>
                                    )}
                                </div>
                                
                                <div className={`${viewMode === 'list' ? 'flex-1' : 'mb-4 flex-1'}`} style={{ flex: 1, marginBottom: viewMode === 'list' ? '0' : '1rem' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {course.subject && (
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                {course.subject}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`${viewMode === 'list' ? 'text-base' : 'text-lg'} font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`} style={{ fontWeight: 600, marginBottom: viewMode === 'list' ? '0' : '0.5rem' }}>
                                        {course.title || 'Sans titre'}
                                    </h3>
                                    {viewMode === 'grid' && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {stripMarkdown(course.details || course.content || '')}
                                        </p>
                                    )}
                                </div>
                                
                                <div className={`${viewMode === 'grid' ? 'pt-4 border-t border-slate-100 dark:border-slate-700' : ''} flex items-center justify-between mt-auto shrink-0`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: viewMode === 'grid' ? '1rem' : '0', borderTop: viewMode === 'grid' ? '1px solid #f1f5f9' : 'none' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                                            <FileText size={14} weight="bold" />
                                            {prog ? prog.total : 0} Cartes
                                        </div>
                                        <span className="text-xs text-slate-400">Modifié il y a {elapsed}h</span>
                                        {viewMode === 'list' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                                className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};
