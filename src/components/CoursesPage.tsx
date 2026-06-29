// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash, ListDashes, SquaresFour, FileText, MagnifyingGlass } from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { stripMarkdown } from '../utils';
import { FullCourseEditor } from './FullCourseEditor';
import { CourseViewer } from './CourseViewer';
import { AddDataModal } from './AddDataModal';
import { useCardStore as useCards } from '../store/useCardStore';

interface CoursesPageProps {
    onPause?: (draft: Partial<Card>) => void;
    initialDraft?: Card | null;
    onDraftConsumed?: () => void;
}

// Color palette per subject group (bg bar color, text color for icon)
const GROUP_COLORS = [
    { bar: '#10b981', icon: '#10b981' }, // emerald
    { bar: '#a855f7', icon: '#a855f7' }, // purple
    { bar: '#3b82f6', icon: '#3b82f6' }, // blue
    { bar: '#f43f5e', icon: '#f43f5e' }, // rose
    { bar: '#f59e0b', icon: '#f59e0b' }, // amber
    { bar: '#06b6d4', icon: '#06b6d4' }, // cyan
];

export const CoursesPage: React.FC<CoursesPageProps> = ({
    onPause,
    initialDraft,
    onDraftConsumed
}) => {
    const { cards, handleSaveCard: onSaveCourse, handleDeleteCard: onDeleteCourse } = useCards();
    const existingCards = cards;
    const courseCards = useMemo(() => cards.filter(c => c.nodeType === 'course').sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), [cards]);
    const [editingCourse, setEditingCourse] = useState<Card | null>(null);
    const [viewingCourse, setViewingCourse] = useState<Card | null>(null);
    const [editingFlashcard, setEditingFlashcard] = useState<Card | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [now] = useState(() => Date.now());

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
        return result;
    }, [courseCards, selectedTag, search]);

    // Group by subject for list view
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

    const handleCreate = () => {
        setIsCreating(true);
        setEditingCourse({
            id: `course-${Date.now()}`,
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
                onPause={(draft) => {
                    onPause?.(draft);
                }}
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
                        id: `concept-${Date.now()}`,
                        type: viewingCourse.type || 'drug', // inherit subject or default
                        nodeType: 'concept',
                        parentId: viewingCourse.id,
                        title: '',
                        content: '',
                        details: '',
                        tags: viewingCourse.tags || [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
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
                        id: `flashcard-${Date.now()}`,
                        type: viewingCourse.type || 'drug', // inherit category
                        nodeType: 'flashcard',
                        parentId: viewingCourse.id,
                        title: '',
                        content: '',
                        details: '',
                        format: 'q&a',
                        tags: viewingCourse.tags || [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                }}
                onEditFlashcard={(flashcardId) => {
                    const fc = cards.find(c => c.id === flashcardId);
                    if (fc) setEditingFlashcard(fc);
                }}
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
                    layout="modal"
                />
            )}
            </>
        );
    }

    return (
        <div style={{
            padding: '3rem 3.5rem',
            maxWidth: '900px',
            width: '100%',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexShrink: 0 }}>
                {/* Left: icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        flexShrink: 0,
                    }}>
                        <BookOpen size={26} weight="duotone" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                            Fiches de Cours
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '3px 0 0 0' }}>
                            {courseCards.length > 0 ? `${courseCards.length} fiche${courseCards.length > 1 ? 's' : ''}` : 'Centralisez vos connaissances'}
                        </p>
                    </div>
                </div>

                {/* Right: view toggle + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {/* View mode toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '4px',
                        gap: '2px',
                    }}>
                        <button
                            onClick={() => setViewMode('list')}
                            title="Vue liste"
                            style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: viewMode === 'list' ? 'rgba(16,185,129,0.15)' : 'transparent',
                                color: viewMode === 'list' ? '#10b981' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ListDashes size={18} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Vue grille"
                            style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: viewMode === 'grid' ? 'rgba(16,185,129,0.15)' : 'transparent',
                                color: viewMode === 'grid' ? '#10b981' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <SquaresFour size={18} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
                        </button>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleCreate}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.1px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
                    >
                        <Plus size={16} weight="bold" />
                        Nouveau Cours
                    </button>
                </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', margin: '2rem 0', flexShrink: 0, opacity: 0.5 }} />

            {/* ── Search + Filters ── */}
            {courseCards.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem', flexShrink: 0 }}>
                    {/* Search bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '0 14px',
                        height: '42px',
                    }}>
                        <MagnifyingGlass size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un cours…"
                            style={{
                                flex: 1,
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                fontSize: '14px',
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>

                    {/* Tag filters */}
                    {allTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setSelectedTag(null)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: '20px',
                                    border: `1px solid ${selectedTag === null ? 'var(--color-border)' : 'transparent'}`,
                                    background: selectedTag === null ? 'var(--color-surface)' : 'transparent',
                                    color: selectedTag === null ? 'var(--color-text)' : 'var(--color-text-muted)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                Tous
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    style={{
                                        padding: '5px 14px',
                                        borderRadius: '20px',
                                        border: `1px solid ${selectedTag === tag ? 'rgba(16,185,129,0.4)' : 'transparent'}`,
                                        background: selectedTag === tag ? 'rgba(16,185,129,0.1)' : 'transparent',
                                        color: selectedTag === tag ? '#10b981' : 'var(--color-text-muted)',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '3rem' }} className="custom-scrollbar">
                {filteredCourses.length === 0 ? (
                    /* Empty state */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '45vh', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                        }}>
                            <BookOpen size={26} weight="duotone" />
                        </div>
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                                {courseCards.length === 0 ? 'Aucun cours pour l\'instant' : 'Aucun résultat'}
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, maxWidth: '280px' }}>
                                {courseCards.length === 0
                                    ? 'Créez votre première fiche de cours pour commencer.'
                                    : 'Essayez une autre recherche ou filtre.'}
                            </p>
                        </div>
                        {courseCards.length === 0 && (
                            <button
                                onClick={handleCreate}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(16,185,129,0.12)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16,185,129,0.25)',
                                    borderRadius: '10px',
                                    padding: '9px 18px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginTop: '4px',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                            >
                                <Plus size={15} weight="bold" />
                                Créer un cours
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid view */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                        {filteredCourses.map((course, i) => {
                            const colorIdx = i % GROUP_COLORS.length;
                            const col = GROUP_COLORS[colorIdx];
                            const preview = stripMarkdown(course.details || course.content || '');
                            return (
                                <div
                                    key={course.id}
                                    onClick={() => handleView(course)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') handleView(course);
                                    }}
                                    className="group"
                                    style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                        position: 'relative',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = col.bar;
                                        e.currentTarget.style.boxShadow = `0 0 0 1px ${col.bar}22`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: `${col.bar}1a`, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <FileText size={18} color={col.icon} weight="regular" />
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); onDeleteCourse(course); }}
                                            style={{
                                                padding: '4px', border: 'none', background: 'transparent',
                                                color: 'var(--color-text-muted)', cursor: 'pointer',
                                                borderRadius: '6px', opacity: 0, transition: 'opacity 0.15s, color 0.15s',
                                            }}
                                            className="group-hover:opacity-100"
                                            onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.opacity = '1'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.opacity = '0'; }}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                                            {course.title || 'Sans titre'}
                                        </h3>
                                        {course.subject && (
                                            <span style={{ fontSize: '12px', color: col.icon, fontWeight: 500 }}>
                                                {course.subject}
                                            </span>
                                        )}
                                    </div>
                                    {preview && (
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {preview}
                                        </p>
                                    )}
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
                                        {new Date(course.updatedAt || now).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List view — grouped by subject */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {groupedCourses.sortedKeys.map((subject, groupIdx) => {
                            const colorIdx = groupIdx % GROUP_COLORS.length;
                            const col = GROUP_COLORS[colorIdx];

                            return (
                                <div key={subject}>
                                    {/* Subject header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                                        <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                            {subject}
                                        </h2>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)', opacity: 0.6 }} />
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                            {groupedCourses.groups[subject].length} fiche{groupedCourses.groups[subject].length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Course rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {groupedCourses.groups[subject].map((course) => {
                                            // Compute real progress from checkboxes
                                            const text = course.details || course.content || '';
                                            const total = (text.match(/\[[ x]\]/gi) || []).length;
                                            const checked = (text.match(/\[[xX]\]/g) || []).length;
                                            const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
                                            const hasProgress = total > 0;

                                            return (
                                                <div
                                                    key={course.id}
                                                    onClick={() => handleView(course)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') handleView(course);
                                                    }}
                                                    className="course-list-row"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '16px',
                                                        padding: '14px 18px',
                                                        borderRadius: '14px',
                                                        background: 'var(--color-surface)',
                                                        border: '1px solid var(--color-border)',
                                                        cursor: 'pointer',
                                                        transition: 'border-color 0.15s, background 0.15s',
                                                        position: 'relative',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = `${col.bar}55`;
                                                        e.currentTarget.style.background = `color-mix(in srgb, var(--color-surface) 90%, ${col.bar})`;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                                        e.currentTarget.style.background = 'var(--color-surface)';
                                                    }}
                                                >
                                                    {/* Left: icon + title */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: '34px', height: '34px', borderRadius: '10px',
                                                            background: `${col.bar}18`, flexShrink: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <FileText size={17} color={col.icon} weight="regular" />
                                                        </div>
                                                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {course.title || 'Sans titre'}
                                                        </span>
                                                    </div>

                                                    {/* Right: progress + date + delete */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                                                        {/* Progress */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: hasProgress ? 'var(--color-text)' : 'var(--color-text-muted)', width: '36px', textAlign: 'right' }}>
                                                                {progress}%
                                                            </span>
                                                            <div style={{
                                                                width: '72px', height: '5px',
                                                                borderRadius: '99px',
                                                                background: 'var(--color-border)',
                                                                overflow: 'hidden',
                                                            }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${progress}%`,
                                                                    background: col.bar,
                                                                    borderRadius: '99px',
                                                                    transition: 'width 0.4s ease',
                                                                }} />
                                                            </div>
                                                        </div>

                                                        {/* Date */}
                                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', width: '80px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                            {new Date(course.updatedAt || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); onDeleteCourse(course); }}
                                                            style={{
                                                                padding: '5px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--color-text-muted)',
                                                                cursor: 'pointer',
                                                                borderRadius: '7px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                opacity: 0,
                                                                transition: 'opacity 0.15s, color 0.15s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.opacity = '1'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.opacity = '0'; }}
                                                            onFocus={e => { e.currentTarget.style.opacity = '1'; }}
                                                        >
                                                            <Trash size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
