import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash } from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { stripMarkdown } from '../utils';
import { FullCourseEditor } from './FullCourseEditor';
import { CourseViewer } from './CourseViewer';

interface CoursesPageProps {
    cards: Card[];
    onHome: () => void;
    onSaveCourse: (card: Card) => void;
    onDeleteCourse: (card: Card) => void;
    existingCards: Card[];
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
    cards,
    onSaveCourse,
    onDeleteCourse,
    existingCards
}) => {
    const courseCards = useMemo(() => cards.filter(c => c.type === COURSE_TYPE).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), [cards]);
    const [editingCourse, setEditingCourse] = useState<Card | null>(null);
    const [viewingCourse, setViewingCourse] = useState<Card | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => 
                (c.title && c.title.toLowerCase().includes(q)) || 
                (c.details && c.details.toLowerCase().includes(q))
            );
        }
        return result;
    }, [courseCards, searchQuery, selectedTag]);

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
            updatedAt: Date.now(),
            id: isCreating && updatedCourse.title ? generateId(updatedCourse.title) : updatedCourse.id
        });
        setEditingCourse(null);
        setIsCreating(false);
        // If it was a new course, maybe open it in viewer, or just go back to list
        if (!isCreating) {
            setViewingCourse(updatedCourse);
        }
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BookOpen size={28} color="var(--color-drug)" weight="duotone" />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Fiches de Cours</h1>
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
                    <Plus size={18} weight="bold" />
                    Nouveau Cours
                </button>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                {/* Search and Filters */}
                {courseCards.length > 0 && (
                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input 
                            type="text"
                            placeholder="Rechercher dans les cours..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', width: '100%', maxWidth: '400px' }}
                        />
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
                ) : (
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
                )}
            </div>
        </div>
    );
};
