import React, { useState, useMemo } from 'react';
import { Brain, Graph, Lightning, CheckCircle, LockKey, BookOpen, Timer, CaretDown, CaretUp, Play, Funnel, X, Check } from '@phosphor-icons/react';
import type { Card } from '../types';
import { CARD_TYPES } from '../types';
import { useDueCards } from '../hooks/useDueCards';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ReviewHubPageProps {
    onSelectFSRS: (tags?: string[]) => void;
    onSelectCluster: () => void;
    onSelectIntensive: () => void;
    onSelectCourse: (courseId: string) => void;
    onSelectQuiz: () => void;
    onSelectCustom: (config: { tags: string[]; types: string[]; statuses: string[]; limit: number | null }) => void;
    hasEnoughCardsForCluster: boolean;
    courses: Card[];
    allCards: Card[];
}

export const ReviewHubPage: React.FC<ReviewHubPageProps> = ({
    onSelectFSRS,
    onSelectCluster,
    onSelectIntensive,
    onSelectCourse,
    onSelectQuiz,
    onSelectCustom,
    hasEnoughCardsForCluster,
    courses,
    allCards,
}) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [coursePickerOpen, setCoursePickerOpen] = useState(false);

    // Courses that have at least 1 flashcard
    const coursesWithFlashcards = useMemo(() =>
        courses.filter(course =>
            allCards.some(c => c.nodeType === 'flashcard' && c.parentId === course.id)
        ),
        [courses, allCards]
    );

    const selectedCourse = useMemo(() =>
        selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null,
        [selectedCourseId, courses]
    );

    const selectedCourseFlashcards = useMemo(() =>
        selectedCourseId
            ? allCards.filter(c => c.nodeType === 'flashcard' && c.parentId === selectedCourseId)
            : [],
        [selectedCourseId, allCards]
    );

    
    const [customDeckOpen, setCustomDeckOpen] = useState(false);
    const customDeckModalRef = useFocusTrap(customDeckOpen);
    const [customConfig, setCustomConfig] = useState<{ tags: string[]; types: string[]; statuses: string[]; limit: number | null }>({ tags: [], types: [], statuses: [], limit: null });
    const [fsrsTags, setFsrsTags] = useState<string[]>([]);
    const [fsrsTagPickerOpen, setFsrsTagPickerOpen] = useState(false);
    
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        allCards.forEach(c => {
            if (c.tags) c.tags.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [allCards]);

    const customDeckMatchCount = useMemo(() => {
        let pool = allCards.filter(c => c.nodeType === 'flashcard');
        if (customConfig.types.length > 0) pool = pool.filter(c => customConfig.types.includes(c.type));
        if (customConfig.tags.length > 0) pool = pool.filter(c => c.tags?.some(t => customConfig.tags.includes(t)));
        if (customConfig.statuses.length > 0) pool = pool.filter(c => customConfig.statuses.includes(c.progress?.status || 'new'));
        return customConfig.limit ? Math.min(pool.length, customConfig.limit) : pool.length;
    }, [allCards, customConfig]);

    const { dueCards } = useDueCards(allCards);

    const fsrsDueCount = useMemo(() => {
        if (fsrsTags.length > 0) {
            return dueCards.filter(c => c.tags && c.tags.some(t => fsrsTags.includes(t))).length;
        }
        return dueCards.length;
    }, [dueCards, fsrsTags]);
    
    const totalDue = dueCards.length;

    const hasCustomFilters = customConfig.tags.length > 0 || customConfig.types.length > 0 || customConfig.statuses.length > 0;

    const handleToggleCustomTag = (tag: string) => {
        setCustomConfig(prev => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
        }));
    };
    const handleToggleCustomType = (type: string) => {
        setCustomConfig(prev => ({
            ...prev,
            types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
        }));
    };
    const handleToggleCustomStatus = (status: string) => {
        setCustomConfig(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status) ? prev.statuses.filter(t => t !== status) : [...prev.statuses, status]
        }));
    };

    const totalFlashcards = allCards.filter(c => c.nodeType === 'flashcard').length;
    const hasEnoughForQuiz = totalFlashcards >= 5;

    return (
        <div style={{
            flex: 1, overflow: 'hidden',
            background: 'var(--color-bg)',
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            padding: '20px 32px 16px',
        }}>
            <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.3px' }}>
                                Espace de Révision
                            </h1>
                        </div>

                    {/* Due counter badge */}
                    {totalDue > 0 ? (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '7px 16px', borderRadius: 100,
                            border: '1.5px solid rgba(16,185,129,0.25)',
                            background: 'rgba(16,185,129,0.06)',
                            color: '#059669', fontSize: 13, fontWeight: 700,
                        }}>
                            <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                                <span style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    borderRadius: '50%', background: '#10b981',
                                    opacity: 0.75,
                                    animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
                                }} />
                                <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'block' }} />
                            </span>
                            {totalDue} carte{totalDue > 1 ? 's' : ''} à réviser
                        </div>
                    ) : (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '7px 14px', borderRadius: 100,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text)', fontSize: 13, fontWeight: 600,
                        }}>
                            <CheckCircle size={15} weight="fill" style={{ color: '#10b981' }} />
                            Tout est à jour
                        </div>
                    )}
                    </div>
                </div>

                {/* ── LE QUOTIDIEN (FSRS Hero) ── */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 14, background: '#10b981', borderRadius: 4 }} />
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            Le Quotidien
                        </h2>
                    </div>
                    
                    <div style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 16, padding: '20px',
                        display: 'flex', flexDirection: 'column',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, zIndex: 1, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 14,
                                    background: 'rgba(16,185,129,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#10b981', flexShrink: 0
                                }}>
                                    <Brain size={28} weight="duotone" />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Faire mes révisions</h3>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '3px 6px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FSRS IA</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4, margin: 0, maxWidth: 500 }}>
                                        L'algorithme sélectionne les cartes exactes à revoir aujourd'hui pour optimiser votre mémoire à long terme.
                                    </p>
                                    
                                    {uniqueTags.length > 0 && (
                                        <div style={{ marginTop: 10, position: 'relative' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFsrsTagPickerOpen(!fsrsTagPickerOpen); }}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    background: fsrsTags.length > 0 ? 'rgba(16,185,129,0.1)' : 'var(--color-bg)',
                                                    border: fsrsTags.length > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)',
                                                    color: fsrsTags.length > 0 ? '#10b981' : 'var(--color-text-muted)',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Funnel size={12} weight={fsrsTags.length > 0 ? "fill" : "regular"} />
                                                {fsrsTags.length > 0 ? `${fsrsTags.length} tag(s) actif(s)` : 'Filtrer la session'}
                                            </button>
                                            
                                            {fsrsTagPickerOpen && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: 0, zIndex: 50,
                                                    marginTop: 6, width: 220, background: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border)', borderRadius: 10,
                                                    boxShadow: 'var(--shadow-lg)', padding: 10,
                                                    display: 'flex', flexDirection: 'column', gap: 6
                                                }}>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tags</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                        {uniqueTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => setFsrsTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                                style={{
                                                                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                                                                    border: fsrsTags.includes(tag) ? '1px solid #10b981' : '1px solid var(--color-border)',
                                                                    background: fsrsTags.includes(tag) ? 'rgba(16,185,129,0.1)' : 'var(--color-bg)',
                                                                    color: fsrsTags.includes(tag) ? '#10b981' : 'var(--color-text-muted)',
                                                                }}
                                                            >
                                                                #{tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setFsrsTagPickerOpen(false)} style={{ marginTop: 4, padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                                        Fermer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => onSelectFSRS(fsrsTags)}
                                disabled={fsrsDueCount === 0}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '12px 24px', borderRadius: 12, border: 'none',
                                    background: fsrsDueCount > 0 ? '#10b981' : 'var(--color-bg)',
                                    color: fsrsDueCount > 0 ? '#fff' : 'var(--color-text-muted)',
                                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                                    cursor: fsrsDueCount > 0 ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    boxShadow: fsrsDueCount > 0 ? '0 4px 10px rgba(16,185,129,0.2)' : 'none'
                                }}
                            >
                                {fsrsDueCount > 0 ? (
                                    <><Play size={16} weight="fill" /> Démarrer ({fsrsDueCount})</>
                                ) : 'À jour'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── MODES DE DÉCOUVERTE ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 14, background: 'var(--color-text-muted)', borderRadius: 4 }} />
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Modes de découverte
                    </h2>
                </div>
                
                {/* Secondary Modes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1, minHeight: 0 }}>

                    {/* ── Mode Par Cours ── */}
                    <div style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14, padding: '16px 18px',
                        display: 'flex', flexDirection: 'column', gap: 10,
                        opacity: coursesWithFlashcards.length > 0 ? 1 : 0.6,
                        transition: 'box-shadow 0.2s',
                    }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                        <BookOpen size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par Cours</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Révision Ciblée</div>
                                    </div>
                                </div>
                                {coursesWithFlashcards.length === 0 && <LockKey size={16} style={{ color: 'var(--color-text-muted)' }} />}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                                Sélectionnez un cours et révisez toutes les flashcards qui y sont rattachées.
                            </p>

                            {/* Course picker */}
                            {coursesWithFlashcards.length > 0 && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setCoursePickerOpen(v => !v)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: 10,
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)',
                                            cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                            color: selectedCourse ? 'var(--color-text)' : 'var(--color-text-muted)',
                                        }}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedCourse ? selectedCourse.title : 'Choisir un cours...'}
                                        </span>
                                        {coursePickerOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                    </button>
                                    {coursePickerOpen && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                            marginTop: 4, background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 10, overflow: 'hidden',
                                            boxShadow: 'var(--shadow-lg)',
                                            maxHeight: 220, overflowY: 'auto',
                                        }}>
                                            {coursesWithFlashcards.map(course => {
                                                const fcCount = allCards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id).length;
                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourseId(course.id);
                                                            setCoursePickerOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 14px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            fontSize: 13, fontWeight: 500,
                                                            color: 'var(--color-text)',
                                                            background: selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                                                            borderBottom: '1px solid var(--color-border)',
                                                            transition: 'background 0.1s',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent'}
                                                    >
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{course.title}</span>
                                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8, flexShrink: 0 }}>{fcCount} cartes</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => selectedCourseId && onSelectCourse(selectedCourseId)}
                            disabled={!selectedCourseId || coursesWithFlashcards.length === 0}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '11px 16px', borderRadius: 10, border: 'none',
                                background: selectedCourseId ? '#3b82f6' : 'var(--color-bg)',
                                color: selectedCourseId ? '#fff' : 'var(--color-text-muted)',
                                fontWeight: 700, fontSize: 14, cursor: selectedCourseId ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s', marginTop: 'auto',
                            }}
                            onMouseEnter={e => { if (selectedCourseId) e.currentTarget.style.filter = 'brightness(0.9)'; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                        >
                            {selectedCourseId ? (
                                <><Play size={16} weight="fill" /> Démarrer ({selectedCourseFlashcards.length})</>
                            ) : (
                                <>{coursesWithFlashcards.length === 0 ? <><LockKey size={14} /> Aucun cours avec flashcards</> : 'Sélectionnez un cours'}</>
                            )}
                        </button>
                    </div>

                    {/* ── Mode Quiz Minuté ── */}
                    <ModeCard
                        badge="Quiz · 5 min"
                        badgeColor="#f59e0b"
                        badgeBg="rgba(245,158,11,0.1)"
                        icon={<Timer size={22} weight="duotone" />}
                        iconColor="#f59e0b"
                        title="Quiz Express"
                        subtitle="Entraînement"
                        description="10 cartes, 30 secondes chacune. Un timer par question vous force à répondre rapidement et renforce la récupération active."
                        actionLabel={hasEnoughForQuiz ? 'Lancer le quiz' : 'Cartes insuffisantes'}
                        actionColor="#f59e0b"
                        disabled={!hasEnoughForQuiz}
                        onClick={onSelectQuiz}
                    />

                    {/* ── Mode Cluster ── */}
                    <ModeCard
                        badge="CLUSTER · Graphe"
                        badgeColor="#8b5cf6"
                        badgeBg="rgba(139,92,246,0.1)"
                        icon={<Graph size={22} weight="duotone" />}
                        iconColor="#8b5cf6"
                        title="Par Connexions"
                        subtitle="Thématique"
                        description="Révisez un sujet dans toutes ses dimensions : sélectionnez un nœud central et parcourez les fiches qui lui sont liées."
                        actionLabel={hasEnoughCardsForCluster ? 'Explorer le graphe' : 'Liens insuffisants'}
                        actionColor="#8b5cf6"
                        disabled={!hasEnoughCardsForCluster}
                        onClick={onSelectCluster}
                    />

                    {/* ── Mode Intensif ── */}
                    <ModeCard
                        badge="INTENSIF · Urgence"
                        badgeColor="#ef4444"
                        badgeBg="rgba(239,68,68,0.1)"
                        icon={<Lightning size={22} weight="duotone" />}
                        iconColor="#ef4444"
                        title="Bachotage"
                        subtitle="Révision rapide"
                        description="Session aléatoire de 30 cartes. Les résultats n'impactent pas votre planning FSRS — parfait pour un entraînement libre."
                        actionLabel="Session aléatoire"
                        actionColor="#ef4444"
                        disabled={false}
                        onClick={onSelectIntensive}
                    />

                    {/* ── Mode Personnalisé ── */}
                    <ModeCard
                        badge="FILTRES · Tags"
                        badgeColor="#3b82f6"
                        badgeBg="rgba(59,130,246,0.1)"
                        icon={<Funnel size={22} weight="duotone" />}
                        iconColor="#3b82f6"
                        title="Deck Personnalisé"
                        subtitle="Ciblé"
                        description="Créez une session sur-mesure en filtrant par tags, catégories ou statut d'apprentissage."
                        actionLabel="Configurer le deck"
                        actionColor="#3b82f6"
                        disabled={false}
                        onClick={() => setCustomDeckOpen(true)}
                    />


                </div>
            </div>

            
            {/* Custom Deck Modal */}
            {customDeckOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setCustomDeckOpen(false)} />
                    <div ref={customDeckModalRef as any} style={{ position: 'relative', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 20, width: '100%', maxWidth: 600, padding: 32, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setCustomDeckOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8, borderRadius: '50%' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <X size={20} />
                        </button>
                        
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px 0' }}>Créer un Deck Personnalisé</h2>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>Filtrez les cartes pour cibler exactement ce que vous voulez réviser maintenant.</p>
                        </div>

                        {/* Catégories */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>1. Catégories</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {CARD_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleToggleCustomType(type)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                            border: customConfig.types.includes(type) ? '1px solid #3b82f6' : '1px solid var(--color-border)',
                                            background: customConfig.types.includes(type) ? 'rgba(59,130,246,0.1)' : 'var(--color-surface)',
                                            color: customConfig.types.includes(type) ? '#3b82f6' : 'var(--color-text)',
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>2. Tags (Union)</label>
                            {uniqueTags.length === 0 ? (
                                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun tag utilisé pour l'instant.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: '4px', margin: '-4px' }} className="custom-scrollbar">
                                    {uniqueTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleToggleCustomTag(tag)}
                                            style={{
                                                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                                border: customConfig.tags.includes(tag) ? '1px solid #8b5cf6' : '1px solid var(--color-border)',
                                                background: customConfig.tags.includes(tag) ? 'rgba(139,92,246,0.1)' : 'var(--color-surface)',
                                                color: customConfig.tags.includes(tag) ? '#8b5cf6' : 'var(--color-text-muted)',
                                            }}
                                        >
                                            {customConfig.tags.includes(tag) ? <Check size={12} weight="bold" /> : '#'}
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>3. Statut d'apprentissage</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[
                                    { id: 'new', label: 'Nouvelles', color: '#6366f1' },
                                    { id: 'learning', label: 'En apprentissage', color: '#f59e0b' },
                                    { id: 'review', label: 'À réviser', color: '#10b981' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => handleToggleCustomStatus(status.id)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                                            border: customConfig.statuses.includes(status.id) ? `1px solid ${status.color}` : '1px solid var(--color-border)',
                                            background: customConfig.statuses.includes(status.id) ? `${status.color}15` : 'var(--color-surface)',
                                            color: customConfig.statuses.includes(status.id) ? status.color : 'var(--color-text)',
                                        }}
                                    >
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color, opacity: customConfig.statuses.includes(status.id) ? 1 : 0.5 }} />
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Limite */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>4. Limite de cartes</label>
                            <select 
                                value={customConfig.limit === null ? 'all' : customConfig.limit.toString()} 
                                onChange={e => setCustomConfig(prev => ({ ...prev, limit: e.target.value === 'all' ? null : parseInt(e.target.value) }))}
                                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, outline: 'none', width: '100%', maxWidth: 200 }}
                            >
                                <option value="10">10 cartes</option>
                                <option value="20">20 cartes</option>
                                <option value="50">50 cartes</option>
                                <option value="100">100 cartes</option>
                                <option value="all">Toutes les cartes</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                {hasCustomFilters
                                    ? <span><strong style={{ color: 'var(--color-text)' }}>{customDeckMatchCount}</strong> carte{customDeckMatchCount !== 1 ? 's' : ''} correspondante{customDeckMatchCount !== 1 ? 's' : ''}</span>
                                    : <span style={{ color: '#f59e0b' }}>⚠ Sélectionnez au moins un filtre</span>
                                }
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button onClick={() => setCustomConfig({ tags: [], types: [], statuses: [], limit: null })} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 10 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    Réinitialiser
                                </button>
                                <button 
                                    onClick={() => {
                                        if (!hasCustomFilters || customDeckMatchCount === 0) return;
                                        onSelectCustom(customConfig);
                                        setCustomDeckOpen(false);
                                    }}
                                    disabled={!hasCustomFilters || customDeckMatchCount === 0}
                                    title={!hasCustomFilters ? 'Sélectionnez au moins un filtre' : customDeckMatchCount === 0 ? 'Aucune carte ne correspond' : undefined}
                                    style={{ 
                                        padding: '10px 24px', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                                        background: (hasCustomFilters && customDeckMatchCount > 0) ? '#8b5cf6' : 'var(--color-border)',
                                        color: (hasCustomFilters && customDeckMatchCount > 0) ? 'white' : 'var(--color-text-muted)',
                                        cursor: (hasCustomFilters && customDeckMatchCount > 0) ? 'pointer' : 'not-allowed',
                                        boxShadow: (hasCustomFilters && customDeckMatchCount > 0) ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                                        opacity: (hasCustomFilters && customDeckMatchCount > 0) ? 1 : 0.6,
                                    }}
                                >
                                    Démarrer · {customDeckMatchCount} carte{customDeckMatchCount !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

// ── Reusable Mode Card ──────────────────────────────────────────────────────
interface ModeCardProps {
    badge: string;
    badgeColor: string;
    badgeBg: string;
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle: string;
    description: string;
    actionLabel: string;
    actionColor: string;
    disabled: boolean;
    onClick: () => void;
    pulsing?: boolean;
    children?: React.ReactNode;
}

const ModeCard: React.FC<ModeCardProps> = ({
    badge, badgeColor, badgeBg, icon, iconColor,
    title, description,
    actionLabel, disabled, onClick, children
}) => (
    <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
            }
        }}
        style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'box-shadow 0.2s, transform 0.15s, border-color 0.2s',
            minHeight: 0, overflow: 'hidden',
        }}
        onMouseEnter={e => {
            if (!disabled) {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = badgeColor + '50';
            }
        }}
        onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
    >
        {/* Icon + meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: badgeBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: iconColor, flexShrink: 0,
                }}>
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
                </div>
                <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                        {badge}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginTop: 2 }}>{title}</div>
                </div>
            </div>
            {disabled && <LockKey size={14} style={{ color: 'var(--color-text-muted)' }} />}
        </div>

        <p style={{
            fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0,
            flex: 1, minHeight: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
            {description}
        </p>

        {children}
        
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
                onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
                disabled={disabled}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', border: 'none', background: 'transparent',
                    color: disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
                    fontWeight: 700, fontSize: 13,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'color 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = iconColor; }}
                onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = 'var(--color-text)'; }}
            >
                {actionLabel}
                {!disabled && <span style={{ marginLeft: 4 }}>→</span>}
            </button>
        </div>
    </div>
);
