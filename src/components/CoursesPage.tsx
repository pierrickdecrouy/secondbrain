import React, { useState, useMemo } from 'react';
import {
    BookOpen, Plus, Trash, ListDashes, SquaresFour, FileText,
    MagnifyingGlass, PencilSimple, Brain, Clock, Tag
} from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { stripMarkdown } from '../utils';
import { FullCourseEditor } from './FullCourseEditor';
import { CourseViewer } from './CourseViewer';
import { AddDataModal } from './AddDataModal';
import { DetailModal } from './DetailModal';
import { useCardStore as useCards } from '../store/useCardStore';

interface CoursesPageProps {
    onPause?: (draft: Partial<Card>) => void;
    initialDraft?: Card | null;
    onDraftConsumed?: () => void;
    onStartReview?: (cardIds: string[], title: string) => void;
}

function formatElapsed(ts: number): string {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return 'à l\'instant';
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
    initialDraft,
    onDraftConsumed,
    onStartReview,
}) => {
    const { cards, handleSaveCard: onSaveCourse, handleDeleteCard: onDeleteCourse } = useCards();
    const existingCards = cards;
    const courseCards = useMemo(
        () => cards.filter(c => c.nodeType === 'course').sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
        [cards]
    );

    const [editingCourse, setEditingCourse] = useState<Card | null>(null);
    const [viewingCourse, setViewingCourse] = useState<Card | null>(null);
    const [viewingConcept, setViewingConcept] = useState<Card | null>(null);
    const [editingFlashcard, setEditingFlashcard] = useState<Card | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isBulkAddingFlashcards, setIsBulkAddingFlashcards] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    React.useEffect(() => {
        if (initialDraft) {
            setEditingCourse(initialDraft);
            setIsCreating(!initialDraft.title);
            onDraftConsumed?.();
        }
    }, [initialDraft, onDraftConsumed]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        courseCards.forEach(c => { if (c.tags) c.tags.forEach(t => tags.add(t)); });
        return Array.from(tags).sort();
    }, [courseCards]);

    const getCourseProgress = (courseId: string) => {
        const flashcards = cards.filter(c => c.nodeType === 'flashcard' && c.parentId === courseId);
        if (flashcards.length === 0) return null;
        const reviewed = flashcards.filter(c => c.progress && c.progress.status !== 'new').length;
        return { total: flashcards.length, reviewed, percentage: Math.round((reviewed / flashcards.length) * 100) };
    };

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
            const sA = a.subject || 'ZZZ';
            const sB = b.subject || 'ZZZ';
            if (sA !== sB) return sA.localeCompare(sB);
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
    }, [courseCards, selectedTag, search]);

    const handleCreate = () => {
        setIsCreating(true);
        setEditingCourse({
            id: generateId(), type: COURSE_TYPE, nodeType: 'course',
            title: '', subtitle: '', content: '', details: '', tags: [],
            createdAt: Date.now(), updatedAt: Date.now()
        });
    };

    const handleEdit = (course: Card) => {
        setIsCreating(false);
        setViewingCourse(null);
        setEditingCourse(course);
    };

    const handleView = (course: Card) => setViewingCourse(course);
    const handleSave = (updatedCourse: Card) => onSaveCourse({ ...updatedCourse, updatedAt: Date.now() });

    if (editingCourse) {
        return (
            <FullCourseEditor
                course={editingCourse}
                onSave={handleSave}
                onCancel={() => {
                    const wasCourse = viewingCourse && editingCourse.id === viewingCourse.id;
                    setEditingCourse(null);
                    setIsCreating(false);
                    if (!isCreating && wasCourse) setViewingCourse(editingCourse);
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
                    onDelete={() => { onDeleteCourse(viewingCourse); setViewingCourse(null); }}
                    onAddConcept={() => {
                        setIsCreating(true);
                        setEditingCourse({
                            id: generateId(), type: viewingCourse.type || 'drug',
                            nodeType: 'concept', parentId: viewingCourse.id,
                            title: '', subtitle: '', content: '', details: '',
                            tags: viewingCourse.tags || [], createdAt: Date.now(), updatedAt: Date.now()
                        });
                    }}
                    onViewConcept={(conceptId) => {
                        const concept = cards.find(c => c.id === conceptId);
                        if (concept) setViewingConcept(concept);
                    }}
                    onEditConcept={(conceptId) => {
                        const concept = cards.find(c => c.id === conceptId);
                        if (concept) { setIsCreating(false); setEditingCourse(concept); }
                    }}
                    onAddFlashcard={() => setEditingFlashcard({
                        id: generateId(), type: viewingCourse.type || 'drug',
                        nodeType: 'flashcard', parentId: viewingCourse.id,
                        title: '', subtitle: '', content: '', details: '',
                        format: 'q&a', tags: viewingCourse.tags || [],
                        createdAt: Date.now(), updatedAt: Date.now()
                    })}
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
                        onSave={(c) => { onSaveCourse(c); setEditingFlashcard(null); }}
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
                                    c.nodeType = 'flashcard';
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
                        onLinkClick={() => {}}
                        actions={
                            <div className="modal-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => { setViewingConcept(null); setIsCreating(false); setEditingCourse(viewingConcept); }}
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

    const isEmpty = filteredCourses.length === 0;

    return (
        <div className="courses-page-root">
            {/* Header */}
            <div className="courses-page-header">
                <div className="courses-page-title-block">
                    <h1 className="courses-page-title">Fiches de cours</h1>
                    <span className="courses-page-count">{courseCards.length} cours</span>
                </div>

                <div className="courses-page-header-actions">
                    <div className="courses-view-toggle">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`courses-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                            title="Vue liste"
                        >
                            <ListDashes size={18} weight="bold" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`courses-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                            title="Vue grille"
                        >
                            <SquaresFour size={18} weight="bold" />
                        </button>
                    </div>

                    <button onClick={handleCreate} className="courses-create-btn">
                        <Plus size={17} weight="bold" />
                        Nouveau cours
                    </button>
                </div>
            </div>

            {/* Search + Tags */}
            <div className="courses-page-filters">
                <div className="courses-search-wrapper">
                    <MagnifyingGlass className="courses-search-icon" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un cours…"
                        className="courses-search-input"
                    />
                </div>

                {allTags.length > 0 && (
                    <div className="courses-tags-row">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`courses-tag-btn${selectedTag === null ? ' active' : ''}`}
                        >
                            Tous
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`courses-tag-btn${selectedTag === tag ? ' active' : ''}`}
                            >
                                <Tag size={11} />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Course list/grid */}
            <div className={`courses-page-list courses-page-list--${viewMode}`}>
                {isEmpty ? (
                    <div className="courses-empty-state">
                        <BookOpen size={40} className="courses-empty-icon" />
                        <h3 className="courses-empty-title">
                            {search || selectedTag ? 'Aucun cours trouvé' : 'Aucun cours pour l\'instant'}
                        </h3>
                        <p className="courses-empty-sub">
                            {search || selectedTag
                                ? 'Modifiez votre recherche ou vos filtres.'
                                : 'Créez votre premier cours pour commencer.'}
                        </p>
                        {!search && !selectedTag && (
                            <button onClick={handleCreate} className="courses-create-btn" style={{ marginTop: 20 }}>
                                <Plus size={17} weight="bold" />
                                Nouveau cours
                            </button>
                        )}
                    </div>
                ) : (
                    filteredCourses.map(course => {
                        const prog = getCourseProgress(course.id);
                        const flashCount = prog?.total ?? 0;
                        const pct = prog?.percentage ?? 0;
                        const hasProgress = pct > 0;

                        return (
                            <div
                                key={course.id}
                                className={`course-card course-card--${viewMode}${hasProgress ? ' course-card--active' : ''}`}
                                onClick={() => handleView(course)}
                            >
                                <div className="course-card-icon">
                                    <BookOpen size={viewMode === 'list' ? 18 : 22} weight="fill" />
                                </div>

                                <div className="course-card-body">
                                    {course.subject && (
                                        <span className="course-card-subject">{course.subject}</span>
                                    )}
                                    <h3 className="course-card-title">
                                        {course.title || 'Sans titre'}
                                    </h3>
                                    {viewMode === 'grid' && (
                                        <p className="course-card-excerpt">
                                            {stripMarkdown(course.details || course.content || '') || 'Aucune description'}
                                        </p>
                                    )}
                                    <div className="course-card-meta">
                                        {flashCount > 0 && (
                                            <span className="course-card-meta-item">
                                                <Brain size={12} />
                                                {flashCount} flashcard{flashCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <span className="course-card-meta-item course-card-meta-time">
                                            <Clock size={12} />
                                            {formatElapsed(course.updatedAt || Date.now())}
                                        </span>
                                        {hasProgress && (
                                            <span className="course-card-meta-item course-card-progress">
                                                <FileText size={12} />
                                                {pct}%
                                            </span>
                                        )}
                                    </div>

                                    {hasProgress && (
                                        <div className="course-card-progress-bar">
                                            <div className="course-card-progress-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                    )}
                                </div>

                                <div className="course-card-actions" onClick={e => e.stopPropagation()}>
                                    <button
                                        className="course-card-action-btn course-card-action-btn--edit"
                                        onClick={e => { e.stopPropagation(); handleEdit(course); }}
                                        title="Modifier"
                                    >
                                        <PencilSimple size={14} />
                                    </button>
                                    <button
                                        className="course-card-action-btn course-card-action-btn--delete"
                                        onClick={e => { e.stopPropagation(); onDeleteCourse(course); }}
                                        title="Supprimer"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
