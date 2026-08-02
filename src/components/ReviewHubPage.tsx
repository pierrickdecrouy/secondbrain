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
        <div className="flex-1 overflow-y-auto w-full h-full bg-slate-50 dark:bg-slate-950 px-8 py-5 flex flex-col" >
            <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-4" >

                {/* Header */}
                <div className="flex items-center justify-between shrink-0" >
                    <div className="flex items-center gap-6" >
                        <div>
                            <h1 className="text-[22px] font-extrabold m-0 tracking-[-0.3px] text-slate-900 dark:text-slate-100" >
                                Espace de Révision
                            </h1>
                        </div>

                    {/* Due counter badge */}
                    {totalDue > 0 ? (
                        <div className="inline-flex items-center gap-2.5 px-4 py-[7px] rounded-full border-[1.5px] border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[13px] font-bold" >
                            <span className="relative flex w-2 h-2" >
                                <span className="absolute top-0 left-0 w-full h-full rounded-full bg-emerald-500 opacity-75 animate-[ping_1.2s_cubic-bezier(0,0,0.2,1)_infinite]"  />
                                <span className="relative block w-2 h-2 rounded-full bg-emerald-500"  />
                            </span>
                            {totalDue} carte{totalDue > 1 ? 's' : ''} à réviser
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3.5 py-[7px] rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[13px] font-semibold" >
                            <CheckCircle size={15} weight="fill" className="text-emerald-500"  />
                            Tout est à jour
                        </div>
                    )}
                    </div>
                </div>

                {/* ── LE QUOTIDIEN (FSRS Hero) ── */}
                <div className="mb-5" >
                    <div className="flex items-center gap-2.5 mb-3" >
                        <div className="w-1 h-3.5 bg-emerald-500 rounded"  />
                        <h2 className="text-[13px] font-bold uppercase tracking-[0.05em] m-0 text-slate-900 dark:text-slate-100" >
                            Le Quotidien
                        </h2>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col relative overflow-visible" >
                        <div className="flex items-center justify-between gap-4 z-10 flex-wrap" >
                            <div className="flex gap-4 items-center" >
                                <div className="w-[52px] h-[52px] rounded-[14px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0" >
                                    <Brain size={28} weight="duotone" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1" >
                                        <h3 className="text-lg font-extrabold m-0 text-slate-900 dark:text-slate-100" >Faire mes révisions</h3>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/15 px-1.5 py-[3px] rounded-md uppercase tracking-[0.05em]" >FSRS IA</span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 max-w-[500px]" >
                                        L'algorithme sélectionne les cartes exactes à revoir aujourd'hui pour optimiser votre mémoire à long terme.
                                    </p>
                                    
                                    {uniqueTags.length > 0 && (
                                        <div className="mt-2.5 relative" >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFsrsTagPickerOpen(!fsrsTagPickerOpen); }}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${fsrsTags.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
                                            >
                                                <Funnel size={12} weight={fsrsTags.length > 0 ? "fill" : "regular"} />
                                                {fsrsTags.length > 0 ? `${fsrsTags.length} tag(s) actif(s)` : 'Filtrer la session'}
                                            </button>
                                            
                                            {fsrsTagPickerOpen && (
                                                <div className="absolute top-full left-0 z-50 mt-1.5 w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-lg p-2.5 flex flex-col gap-1.5" >
                                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase" >Tags</div>
                                                    <div className="flex flex-wrap gap-1" >
                                                        {uniqueTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => setFsrsTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                                className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer border ${fsrsTags.includes(tag) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}
                                                            >
                                                                #{tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setFsrsTagPickerOpen(false)} className="mt-1 p-1.5 bg-transparent border-none text-slate-500 dark:text-slate-400 text-[11px] cursor-pointer font-semibold" >
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
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl border-none font-bold text-sm shrink-0 transition-all duration-200 ${fsrsDueCount > 0 ? 'bg-emerald-500 text-white cursor-pointer shadow-[0_4px_10px_rgba(16,185,129,0.2)]' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'}`}
                            >
                                {fsrsDueCount > 0 ? (
                                    <><Play size={16} weight="fill" /> Démarrer ({fsrsDueCount})</>
                                ) : 'À jour'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── MODES DE DÉCOUVERTE ── */}
                <div className="flex items-center gap-2.5 mb-3" >
                    <div className="w-1 h-3.5 bg-slate-400 dark:bg-slate-600 rounded"  />
                    <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.05em] m-0" >
                        Modes de découverte
                    </h2>
                </div>
                
                {/* Secondary Modes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0" >

                    {/* ── Mode Par Cours ── */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 flex flex-col gap-2.5 transition-shadow duration-200" style={{
  opacity: coursesWithFlashcards.length > 0 ? 1 : 0.6
}}>
                        <div>
                            <div className="flex justify-between items-start mb-2.5" >
                                <div className="flex items-center gap-2" >
                                    <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-500" >
                                        <BookOpen size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.08em]" >Par Cours</div>
                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100" >Révision Ciblée</div>
                                    </div>
                                </div>
                                {coursesWithFlashcards.length === 0 && <LockKey size={16} className="text-slate-500 dark:text-slate-400"  />}
                            </div>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 mb-4" >
                                Sélectionnez un cours et révisez toutes les flashcards qui y sont rattachées.
                            </p>

                            {/* Course picker */}
                            {coursesWithFlashcards.length > 0 && (
                                <div className="relative" >
                                    <button
                                        onClick={() => setCoursePickerOpen(v => !v)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer text-[13px] font-medium ${selectedCourse ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <span className="overflow-hidden text-ellipsis whitespace-nowrap" >
                                            {selectedCourse ? selectedCourse.title : 'Choisir un cours...'}
                                        </span>
                                        {coursePickerOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                    </button>
                                    {coursePickerOpen && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] overflow-hidden shadow-lg max-h-[220px] overflow-y-auto" >
                                            {coursesWithFlashcards.map(course => {
                                                const fcCount = allCards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id).length;
                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourseId(course.id);
                                                            setCoursePickerOpen(false);
                                                        }}
                                                        className="px-3.5 py-2.5 cursor-pointer flex items-center justify-between text-[13px] font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 transition-colors duration-100" style={{
  background: selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent'
}}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent'}
                                                    >
                                                        <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1" >{course.title}</span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 shrink-0" >{fcCount} cartes</span>
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
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border-none font-bold text-sm transition-all duration-200 mt-auto ${selectedCourseId ? 'bg-blue-500 text-white cursor-pointer hover:brightness-90' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed'}`}
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center" >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"  onClick={() => setCustomDeckOpen(false)} />
                    <div ref={customDeckModalRef as any} className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[20px] w-full max-w-[600px] p-8 shadow-xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto" >
                        <button onClick={() => setCustomDeckOpen(false)} className="absolute top-5 right-5 bg-transparent border-none text-slate-500 dark:text-slate-400 cursor-pointer p-2 rounded-full"  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <X size={20} />
                        </button>
                        
                        <div>
                            <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2" >Créer un Deck Personnalisé</h2>
                            <p className="m-0 text-sm text-slate-500 dark:text-slate-400" >Filtrez les cartes pour cibler exactement ce que vous voulez réviser maintenant.</p>
                        </div>

                        {/* Catégories */}
                        <div>
                            <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.05em] mb-3" >1. Catégories</label>
                            <div className="flex flex-wrap gap-2" >
                                {CARD_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleToggleCustomType(type)}
                                        className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200" style={{
  border: customConfig.types.includes(type) ? '1px solid #3b82f6' : '1px solid var(--color-border)',
  background: customConfig.types.includes(type) ? 'rgba(59,130,246,0.1)' : 'var(--color-surface)',
  color: customConfig.types.includes(type) ? '#3b82f6' : 'var(--color-text)'
}}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.05em] mb-3" >2. Tags (Union)</label>
                            {uniqueTags.length === 0 ? (
                                <div className="text-[13px] text-slate-500 dark:text-slate-400 italic" >Aucun tag utilisé pour l'instant.</div>
                            ) : (
                                <div  className="custom-scrollbar flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1 -m-1 custom-scrollbar">
                                    {uniqueTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleToggleCustomTag(tag)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 border ${customConfig.tags.includes(tag) ? 'border-violet-500 bg-violet-500/10 text-violet-500' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}
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
                            <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.05em] mb-3" >3. Statut d'apprentissage</label>
                            <div className="flex flex-wrap gap-2" >
                                {[
                                    { id: 'new', label: 'Nouvelles', color: '#6366f1' },
                                    { id: 'learning', label: 'En apprentissage', color: '#f59e0b' },
                                    { id: 'review', label: 'À réviser', color: '#10b981' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => handleToggleCustomStatus(status.id)}
                                        className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2" style={{
  border: customConfig.statuses.includes(status.id) ? `1px solid ${status.color}` : '1px solid var(--color-border)',
  background: customConfig.statuses.includes(status.id) ? `${status.color}15` : 'var(--color-surface)',
  color: customConfig.statuses.includes(status.id) ? status.color : 'var(--color-text)'
}}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{
  background: status.color,
  opacity: customConfig.statuses.includes(status.id) ? 1 : 0.5
}} />
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Limite */}
                        <div>
                            <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.05em] mb-3" >4. Limite de cartes</label>
                            <select 
                                value={customConfig.limit === null ? 'all' : customConfig.limit.toString()} 
                                onChange={e => setCustomConfig(prev => ({ ...prev, limit: e.target.value === 'all' ? null : parseInt(e.target.value) }))}
                                className="px-3.5 py-2.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none w-full max-w-[200px]" 
                            >
                                <option value="10">10 cartes</option>
                                <option value="20">20 cartes</option>
                                <option value="50">50 cartes</option>
                                <option value="100">100 cartes</option>
                                <option value="all">Toutes les cartes</option>
                            </select>
                        </div>

                        <div className="mt-2 border-t border-slate-200 dark:border-slate-800 pt-6 flex justify-between items-center gap-3" >
                            <div className="text-[0.82rem] text-slate-500 dark:text-slate-400" >
                                {hasCustomFilters
                                    ? <span><strong className="text-slate-900 dark:text-slate-100" >{customDeckMatchCount}</strong> carte{customDeckMatchCount !== 1 ? 's' : ''} correspondante{customDeckMatchCount !== 1 ? 's' : ''}</span>
                                    : <span className="text-amber-500" >⚠ Sélectionnez au moins un filtre</span>
                                }
                            </div>
                            <div className="flex gap-2.5 items-center" >
                                <button onClick={() => setCustomConfig({ tags: [], types: [], statuses: [], limit: null })} className="px-4 py-2.5 bg-transparent border-none text-slate-500 dark:text-slate-400 font-semibold text-sm cursor-pointer rounded-[10px]"  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                                    className={`px-6 py-2.5 border-none rounded-[10px] font-bold text-sm transition-all duration-150 ${hasCustomFilters && customDeckMatchCount > 0 ? 'bg-violet-500 text-white cursor-pointer shadow-[0_4px_12px_rgba(139,92,246,0.3)] opacity-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none opacity-60'}`}
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 flex flex-col gap-2.5 transition-all duration-200 min-h-0 overflow-hidden" style={{
  opacity: disabled ? 0.5 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer'
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
        <div className="flex items-center justify-between" >
            <div className="flex items-center gap-2.5" >
                <div className="w-[34px] h-[34px] rounded-md flex items-center justify-center shrink-0" style={{
  background: badgeBg,
  color: iconColor
}}>
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
                </div>
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] leading-none" style={{
  color: badgeColor
}}>
                        {badge}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mt-0.5" >{title}</div>
                </div>
            </div>
            {disabled && <LockKey size={14} className="text-slate-500 dark:text-slate-400"  />}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed m-0 flex-1 min-h-0 line-clamp-3" >
            {description}
        </p>

        {children}
        
        <div className="mt-auto flex items-center justify-start" >
            <button
                onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
                disabled={disabled}
                className={`flex items-center justify-center gap-1.5 py-2 px-0 border-none bg-transparent font-bold text-[13px] transition-colors duration-200 shrink-0 ${disabled ? 'text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'text-slate-900 dark:text-slate-100 cursor-pointer'}`}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = iconColor; }}
                onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = 'var(--color-text)'; }}
            >
                {actionLabel}
                {!disabled && <span className="ml-1" >→</span>}
            </button>
        </div>
    </div>
);
