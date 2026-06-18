// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash, ListDashes, SquaresFour } from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { stripMarkdown } from '../utils';
import { FullCourseEditor } from './FullCourseEditor';
import { CourseViewer } from './CourseViewer';
import { useCards } from '../context/CardContext';

interface CoursesPageProps {
    onPause?: (draft: Partial<Card>) => void;
    initialDraft?: Card | null;
    onDraftConsumed?: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
    onPause,
    initialDraft,
    onDraftConsumed
}) => {
    const { cards, handleSaveCard: onSaveCourse, handleDeleteCard: onDeleteCourse } = useCards();
    const existingCards = cards;
    const courseCards = useMemo(() => cards.filter(c => c.type === COURSE_TYPE).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), [cards]);
    const [editingCourse, setEditingCourse] = useState<Card | null>(null);
    const [viewingCourse, setViewingCourse] = useState<Card | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Resume draft
    React.useEffect(() => {
        if (initialDraft) {
            setEditingCourse(initialDraft);
            setIsCreating(!initialDraft.title); // Or depending on ID
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

    // Filter courses
    const filteredCourses = useMemo(() => {
        let result = courseCards;
        if (selectedTag) {
            result = result.filter(c => c.tags?.includes(selectedTag));
        }
        return result;
    }, [courseCards, selectedTag]);

    // Group by subject for list view
    const groupedCourses = useMemo(() => {
        const groups: Record<string, Card[]> = {};
        filteredCourses.forEach(c => {
            const subject = c.subject && c.subject.trim() !== '' ? c.subject : 'Général';
            if (!groups[subject]) groups[subject] = [];
            groups[subject].push(c);
        });
        
        // Sort keys (Général at the end, others alphabetical)
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Général') return 1;
            if (b === 'Général') return -1;
            return a.localeCompare(b);
        });

        return { groups, sortedKeys };
    }, [filteredCourses]);

    const handleCreate = () => {
        setIsCreating(true);
        setEditingCourse({
            id: `course-${Date.now()}`,
            type: COURSE_TYPE,
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
        // Auto-save silently; do not close the editor here.
        // Closing the editor is handled by onCancel when clicking "Retour".
    };

    if (editingCourse) {
        return (
            <FullCourseEditor
                course={editingCourse}
                onSave={handleSave}
                onCancel={() => {
                    setEditingCourse(null);
                    setIsCreating(false);
                    // Return to viewer if we were editing an existing course
                    if (!isCreating && editingCourse) {
                        setViewingCourse(editingCourse);
                    }
                }}
                existingCards={existingCards}
                onPause={(draft) => {
                    onPause?.(draft);
                }}
            />
        );
    }

    if (viewingCourse) {
        return (
            <CourseViewer
                course={viewingCourse}
                onBack={() => setViewingCourse(null)}
                onEdit={() => handleEdit(viewingCourse)}
                onDelete={() => {
                    onDeleteCourse(viewingCourse);
                    setViewingCourse(null);
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
            <div className="px-14 pt-14 pb-8 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#111827]">
                <header className="flex flex-col gap-8">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                    <BookOpen size={24} weight="duotone" />
                                </div>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight m-0">
                                    Fiches de Cours
                                </h1>
                            </div>
                            <p className="mt-2 text-base text-slate-500 dark:text-slate-400 max-w-2xl m-0 leading-relaxed pl-[4rem]">
                                Tous vos cours organisés dans cet espace de travail.
                            </p>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center bg-slate-100 dark:bg-[#1A2235] p-1.5 rounded-xl shadow-inner">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-5 py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-[#253D42] text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-white/5' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'}`}
                                    title="Vue en liste"
                                >
                                    <ListDashes size={22} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-5 py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white dark:bg-[#253D42] text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-white/5' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'}`}
                                    title="Vue en grille"
                                >
                                    <SquaresFour size={22} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold border-none cursor-pointer shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                            >
                                <Plus size={22} weight="bold" />
                                Nouveau Cours
                            </button>
                        </div>
                    </div>
                </header>
            </div>

            <div className="px-12 py-8 overflow-y-auto flex-1 custom-scrollbar">
                {/* Search and Filters */}
                {courseCards.length > 0 && (
                    <div className="mb-8 flex flex-col gap-4">

                        {allTags.length > 0 && (
                            <div className="flex gap-3 flex-wrap">
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className={`px-5 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all ${selectedTag === null ? 'bg-slate-800 text-white dark:bg-[#253D42] dark:text-white border-transparent shadow-md' : 'bg-white dark:bg-[#1A2235] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:bg-[#1E3035]'}`}
                                >
                                    Tous les cours
                                </button>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        className={`px-5 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all ${selectedTag === tag ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-900/20' : 'bg-white dark:bg-[#1A2235] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:bg-[#1E3035]'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 h-full mt-24 mb-16 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={48} className="text-slate-400 dark:text-slate-500" weight="duotone" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Aucun cours trouvé</h2>
                        <p className="max-w-md text-[15px] leading-relaxed">
                            {courseCards.length === 0 
                                ? "Créez votre première fiche de cours. Celles-ci sont conçues pour des textes longs et complets." 
                                : "Aucun cours ne correspond à votre recherche."}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                        {filteredCourses.map(course => (
                            <div key={course.id} 
                                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                                onClick={() => handleView(course)}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="m-0 text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{course.title || 'Sans titre'}</h3>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => onDeleteCourse(course)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Mise à jour: {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 m-0 line-clamp-4 leading-relaxed">
                                    {stripMarkdown(course.details || course.content || '')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 max-w-[900px] mx-auto">
                        {groupedCourses.sortedKeys.map(subject => (
                            <div key={subject}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="m-0 text-xl font-bold text-slate-800 dark:text-slate-100">{subject}</h2>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    {groupedCourses.groups[subject].map(course => {
                                        const linkedCardsCount = (course.details?.match(/href="card:\/\//g) || []).length;
                                        return (
                                            <div key={course.id} 
                                                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 px-4 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                                                onClick={() => handleView(course)}
                                            >
                                                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                                    <BookOpen size={20} className="text-slate-400 shrink-0" weight="duotone" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <h3 className="m-0 text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                            {course.title || 'Sans titre'}
                                                        </h3>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6 shrink-0">
                                                    {linkedCardsCount > 0 && (
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            {linkedCardsCount} fiche{linkedCardsCount > 1 ? 's' : ''} liée{linkedCardsCount > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                    <div className="text-slate-500 dark:text-slate-400 text-sm w-24 text-right">
                                                        {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center justify-center"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
