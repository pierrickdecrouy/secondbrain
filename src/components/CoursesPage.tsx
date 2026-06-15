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
        <div className="courses-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
            <div style={{ padding: '32px 32px 16px 32px' }}>
                <header className="flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight m-0">
                                Fiches de Cours
                            </h1>
                            <p className="mt-2 text-base text-[var(--color-text-muted)] max-w-2xl m-0">
                                Tous vos cours organisés dans cet espace de travail.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', backgroundColor: 'var(--color-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        background: viewMode === 'list' ? 'var(--color-bg)' : 'transparent',
                                        border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                                        color: viewMode === 'list' ? 'var(--color-text)' : 'var(--color-text-muted)',
                                        boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                    title="Vue en liste"
                                >
                                    <ListDashes size={20} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        background: viewMode === 'grid' ? 'var(--color-bg)' : 'transparent',
                                        border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                                        color: viewMode === 'grid' ? 'var(--color-text)' : 'var(--color-text-muted)',
                                        boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                    title="Vue en grille"
                                >
                                    <SquaresFour size={20} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'var(--color-drug)',
                                    color: 'white',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'
                                }}
                            >
                                <Plus size={20} />
                                Nouveau Cours
                            </button>
                        </div>
                    </div>


                </header>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                {/* Search and Filters */}
                {courseCards.length > 0 && (
                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {allTags.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    style={{
                                        padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                        backgroundColor: selectedTag === null ? 'var(--color-text)' : 'var(--color-surface)',
                                        color: selectedTag === null ? 'var(--color-surface)' : 'var(--color-text-muted)',
                                        border: selectedTag === null ? '1px solid transparent' : '1px solid var(--color-border)'
                                    }}
                                >
                                    Tous
                                </button>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        style={{
                                            padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                            backgroundColor: selectedTag === tag ? 'var(--color-drug)' : 'var(--color-surface)',
                                            color: selectedTag === tag ? 'white' : 'var(--color-text-muted)',
                                            border: selectedTag === tag ? '1px solid var(--color-drug)' : '1px solid var(--color-border)'
                                        }}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {filteredCourses.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '64px' }}>
                        <BookOpen size={48} color="var(--color-border)" weight="duotone" style={{ margin: '0 auto 16px auto' }} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Aucun cours trouvé</h2>
                        <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                            {courseCards.length === 0 
                                ? "Créez votre première fiche de cours. Celles-ci sont conçues pour des textes longs et complets." 
                                : "Aucun cours ne correspond à votre recherche."}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {filteredCourses.map(course => (
                            <div key={course.id} style={{
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '12px',
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => handleView(course)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                            }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{course.title || 'Sans titre'}</h3>
                                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => onDeleteCourse(course)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Mise à jour: {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                </div>
                                <p style={{
                                    fontSize: '0.95rem',
                                    color: 'var(--color-text-muted)',
                                    margin: 0,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: '1.6'
                                }}>
                                    {stripMarkdown(course.details || course.content || '')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
                        {groupedCourses.sortedKeys.map(subject => (
                            <div key={subject}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{subject}</h2>
                                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--color-border)' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {groupedCourses.groups[subject].map(course => {
                                        const linkedCardsCount = (course.details?.match(/href="card:\/\//g) || []).length;
                                        return (
                                            <div key={course.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: 'var(--color-surface)',
                                                borderRadius: '8px',
                                                padding: '12px 16px',
                                                border: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                            }}
                                            onClick={() => handleView(course)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                                                e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, overflow: 'hidden' }}>
                                                    <BookOpen size={20} color="var(--color-text-muted)" weight="duotone" />
                                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {course.title || 'Sans titre'}
                                                        </h3>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
                                                    {linkedCardsCount > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-drug)' }} />
                                                            {linkedCardsCount} fiche{linkedCardsCount > 1 ? 's' : ''} liée{linkedCardsCount > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', width: '100px', textAlign: 'right' }}>
                                                        {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-red, #dc2626)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
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
