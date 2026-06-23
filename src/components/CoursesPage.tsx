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
        <div className="flex flex-col h-full bg-transparent">
            <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 pt-8 pb-6 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-transparent">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <BookOpen size={24} weight="duotone" />
                            </div>
                            <h1 className="text-[28px] sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight m-0">
                                Fiches de Cours
                            </h1>
                        </div>
                        <p className="text-[15px] text-slate-500 dark:text-slate-400 m-0 pl-16">
                            Centralisez et organisez vos connaissances.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex shrink-0 items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                title="Vue en liste"
                            >
                                <ListDashes size={20} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                title="Vue en grille"
                            >
                                <SquaresFour size={20} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
                            </button>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="group flex shrink-0 items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-[14px] font-medium shadow-sm transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            <Plus size={16} weight="bold" className="shrink-0" />
                            <span>Nouveau Cours</span>
                        </button>
                    </div>
                </header>
            </div>

            <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 py-8 overflow-y-auto flex-1 custom-scrollbar">
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
                    <div className="flex flex-col items-center justify-center text-center h-[50vh] text-slate-500 dark:text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                            <BookOpen size={32} className="text-slate-400 dark:text-slate-500" weight="duotone" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            {courseCards.length === 0 ? "Aucun cours" : "Aucun résultat"}
                        </h2>
                        <p className="max-w-sm text-sm">
                            {courseCards.length === 0 
                                ? "Créez votre première fiche de cours pour commencer à organiser vos connaissances." 
                                : "Aucun cours ne correspond à votre recherche."}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                        {filteredCourses.map(course => (
                            <div key={course.id} 
                                className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
                                onClick={() => handleView(course)}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <h3 className="m-0 text-base font-semibold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2">{course.title || 'Sans titre'}</h3>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => onDeleteCourse(course)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Modifié le {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 m-0 line-clamp-3">
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
                                                className="group flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 px-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                                                onClick={() => handleView(course)}
                                            >
                                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                    <BookOpen size={18} className="text-slate-400 shrink-0" weight="duotone" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <h3 className="m-0 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                            {course.title || 'Sans titre'}
                                                        </h3>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6 shrink-0">
                                                    {linkedCardsCount > 0 && (
                                                        <div className="text-slate-400 text-xs">
                                                            {linkedCardsCount} liée{linkedCardsCount > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                    <div className="text-slate-400 text-xs w-20 text-right">
                                                        {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
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
