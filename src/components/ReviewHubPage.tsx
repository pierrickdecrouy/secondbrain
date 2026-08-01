import React, { useState, useMemo } from 'react';
import { Brain, Graph, Lightning, CheckCircle, LockKey, BookOpen, Timer, CaretDown, CaretUp, Play, Funnel, X, Check } from '@phosphor-icons/react';
import type { Card } from '../types';
import { CARD_TYPES } from '../types';
import { useDueCards } from '../hooks/useDueCards';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './styles/ReviewHubPage.css';

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
        <div className="reviewhubpage-style-1" >
            <div className="reviewhubpage-style-2" >

                {/* Header */}
                <div className="reviewhubpage-style-3" >
                    <div className="reviewhubpage-style-4" >
                        <div>
                            <h1 className="reviewhubpage-style-5" >
                                Espace de Révision
                            </h1>
                        </div>

                    {/* Due counter badge */}
                    {totalDue > 0 ? (
                        <div className="reviewhubpage-style-6" >
                            <span className="reviewhubpage-style-7" >
                                <span className="reviewhubpage-style-8"  />
                                <span className="reviewhubpage-style-9"  />
                            </span>
                            {totalDue} carte{totalDue > 1 ? 's' : ''} à réviser
                        </div>
                    ) : (
                        <div className="reviewhubpage-style-10" >
                            <CheckCircle size={15} weight="fill" className="reviewhubpage-style-11"  />
                            Tout est à jour
                        </div>
                    )}
                    </div>
                </div>

                {/* ── LE QUOTIDIEN (FSRS Hero) ── */}
                <div className="reviewhubpage-style-12" >
                    <div className="reviewhubpage-style-13" >
                        <div className="reviewhubpage-style-14"  />
                        <h2 className="reviewhubpage-style-15" >
                            Le Quotidien
                        </h2>
                    </div>
                    
                    <div className="reviewhubpage-style-16" >
                        <div className="reviewhubpage-style-17" >
                            <div className="reviewhubpage-style-18" >
                                <div className="reviewhubpage-style-19" >
                                    <Brain size={28} weight="duotone" />
                                </div>
                                <div>
                                    <div className="reviewhubpage-style-20" >
                                        <h3 className="reviewhubpage-style-21" >Faire mes révisions</h3>
                                        <span className="reviewhubpage-style-22" >FSRS IA</span>
                                    </div>
                                    <p className="reviewhubpage-style-23" >
                                        L'algorithme sélectionne les cartes exactes à revoir aujourd'hui pour optimiser votre mémoire à long terme.
                                    </p>
                                    
                                    {uniqueTags.length > 0 && (
                                        <div className="reviewhubpage-style-24" >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFsrsTagPickerOpen(!fsrsTagPickerOpen); }}
                                                className="reviewhubpage-style-25" style={{
  background: fsrsTags.length > 0 ? 'rgba(16,185,129,0.1)' : 'var(--color-bg)',
  border: fsrsTags.length > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)',
  color: fsrsTags.length > 0 ? '#10b981' : 'var(--color-text-muted)'
}}
                                            >
                                                <Funnel size={12} weight={fsrsTags.length > 0 ? "fill" : "regular"} />
                                                {fsrsTags.length > 0 ? `${fsrsTags.length} tag(s) actif(s)` : 'Filtrer la session'}
                                            </button>
                                            
                                            {fsrsTagPickerOpen && (
                                                <div className="reviewhubpage-style-26" >
                                                    <div className="reviewhubpage-style-27" >Tags</div>
                                                    <div className="reviewhubpage-style-28" >
                                                        {uniqueTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => setFsrsTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                                className="reviewhubpage-style-29" style={{
  border: fsrsTags.includes(tag) ? '1px solid #10b981' : '1px solid var(--color-border)',
  background: fsrsTags.includes(tag) ? 'rgba(16,185,129,0.1)' : 'var(--color-bg)',
  color: fsrsTags.includes(tag) ? '#10b981' : 'var(--color-text-muted)'
}}
                                                            >
                                                                #{tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setFsrsTagPickerOpen(false)} className="reviewhubpage-style-30" >
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
                                className="reviewhubpage-style-31" style={{
  background: fsrsDueCount > 0 ? '#10b981' : 'var(--color-bg)',
  color: fsrsDueCount > 0 ? '#fff' : 'var(--color-text-muted)',
  cursor: fsrsDueCount > 0 ? 'pointer' : 'not-allowed',
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
                <div className="reviewhubpage-style-32" >
                    <div className="reviewhubpage-style-33"  />
                    <h2 className="reviewhubpage-style-34" >
                        Modes de découverte
                    </h2>
                </div>
                
                {/* Secondary Modes Grid */}
                <div className="reviewhubpage-style-35" >

                    {/* ── Mode Par Cours ── */}
                    <div className="reviewhubpage-style-36" style={{
  opacity: coursesWithFlashcards.length > 0 ? 1 : 0.6
}}>
                        <div>
                            <div className="reviewhubpage-style-37" >
                                <div className="reviewhubpage-style-38" >
                                    <div className="reviewhubpage-style-39" >
                                        <BookOpen size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <div className="reviewhubpage-style-40" >Par Cours</div>
                                        <div className="reviewhubpage-style-41" >Révision Ciblée</div>
                                    </div>
                                </div>
                                {coursesWithFlashcards.length === 0 && <LockKey size={16} className="reviewhubpage-style-42"  />}
                            </div>
                            <p className="reviewhubpage-style-43" >
                                Sélectionnez un cours et révisez toutes les flashcards qui y sont rattachées.
                            </p>

                            {/* Course picker */}
                            {coursesWithFlashcards.length > 0 && (
                                <div className="reviewhubpage-style-44" >
                                    <button
                                        onClick={() => setCoursePickerOpen(v => !v)}
                                        className="reviewhubpage-style-45" style={{
  color: selectedCourse ? 'var(--color-text)' : 'var(--color-text-muted)'
}}
                                    >
                                        <span className="reviewhubpage-style-46" >
                                            {selectedCourse ? selectedCourse.title : 'Choisir un cours...'}
                                        </span>
                                        {coursePickerOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                    </button>
                                    {coursePickerOpen && (
                                        <div className="reviewhubpage-style-47" >
                                            {coursesWithFlashcards.map(course => {
                                                const fcCount = allCards.filter(c => c.nodeType === 'flashcard' && c.parentId === course.id).length;
                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourseId(course.id);
                                                            setCoursePickerOpen(false);
                                                        }}
                                                        className="reviewhubpage-style-48" style={{
  background: selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent'
}}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = selectedCourseId === course.id ? 'rgba(59,130,246,0.08)' : 'transparent'}
                                                    >
                                                        <span className="reviewhubpage-style-49" >{course.title}</span>
                                                        <span className="reviewhubpage-style-50" >{fcCount} cartes</span>
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
                            className="reviewhubpage-style-51" style={{
  background: selectedCourseId ? '#3b82f6' : 'var(--color-bg)',
  color: selectedCourseId ? '#fff' : 'var(--color-text-muted)',
  cursor: selectedCourseId ? 'pointer' : 'not-allowed'
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
                <div className="reviewhubpage-style-52" >
                    <div className="reviewhubpage-style-53"  onClick={() => setCustomDeckOpen(false)} />
                    <div ref={customDeckModalRef as any} className="reviewhubpage-style-54" >
                        <button onClick={() => setCustomDeckOpen(false)} className="reviewhubpage-style-55"  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <X size={20} />
                        </button>
                        
                        <div>
                            <h2 className="reviewhubpage-style-56" >Créer un Deck Personnalisé</h2>
                            <p className="reviewhubpage-style-57" >Filtrez les cartes pour cibler exactement ce que vous voulez réviser maintenant.</p>
                        </div>

                        {/* Catégories */}
                        <div>
                            <label className="reviewhubpage-style-58" >1. Catégories</label>
                            <div className="reviewhubpage-style-59" >
                                {CARD_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleToggleCustomType(type)}
                                        className="reviewhubpage-style-60" style={{
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
                            <label className="reviewhubpage-style-61" >2. Tags (Union)</label>
                            {uniqueTags.length === 0 ? (
                                <div className="reviewhubpage-style-62" >Aucun tag utilisé pour l'instant.</div>
                            ) : (
                                <div  className="custom-scrollbar reviewhubpage-style-63">
                                    {uniqueTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleToggleCustomTag(tag)}
                                            className="reviewhubpage-style-64" style={{
  border: customConfig.tags.includes(tag) ? '1px solid #8b5cf6' : '1px solid var(--color-border)',
  background: customConfig.tags.includes(tag) ? 'rgba(139,92,246,0.1)' : 'var(--color-surface)',
  color: customConfig.tags.includes(tag) ? '#8b5cf6' : 'var(--color-text-muted)'
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
                            <label className="reviewhubpage-style-65" >3. Statut d'apprentissage</label>
                            <div className="reviewhubpage-style-66" >
                                {[
                                    { id: 'new', label: 'Nouvelles', color: '#6366f1' },
                                    { id: 'learning', label: 'En apprentissage', color: '#f59e0b' },
                                    { id: 'review', label: 'À réviser', color: '#10b981' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => handleToggleCustomStatus(status.id)}
                                        className="reviewhubpage-style-67" style={{
  border: customConfig.statuses.includes(status.id) ? `1px solid ${status.color}` : '1px solid var(--color-border)',
  background: customConfig.statuses.includes(status.id) ? `${status.color}15` : 'var(--color-surface)',
  color: customConfig.statuses.includes(status.id) ? status.color : 'var(--color-text)'
}}
                                    >
                                        <div className="reviewhubpage-style-68" style={{
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
                            <label className="reviewhubpage-style-69" >4. Limite de cartes</label>
                            <select 
                                value={customConfig.limit === null ? 'all' : customConfig.limit.toString()} 
                                onChange={e => setCustomConfig(prev => ({ ...prev, limit: e.target.value === 'all' ? null : parseInt(e.target.value) }))}
                                className="reviewhubpage-style-70" 
                            >
                                <option value="10">10 cartes</option>
                                <option value="20">20 cartes</option>
                                <option value="50">50 cartes</option>
                                <option value="100">100 cartes</option>
                                <option value="all">Toutes les cartes</option>
                            </select>
                        </div>

                        <div className="reviewhubpage-style-71" >
                            <div className="reviewhubpage-style-72" >
                                {hasCustomFilters
                                    ? <span><strong className="reviewhubpage-style-73" >{customDeckMatchCount}</strong> carte{customDeckMatchCount !== 1 ? 's' : ''} correspondante{customDeckMatchCount !== 1 ? 's' : ''}</span>
                                    : <span className="reviewhubpage-style-74" >⚠ Sélectionnez au moins un filtre</span>
                                }
                            </div>
                            <div className="reviewhubpage-style-75" >
                                <button onClick={() => setCustomConfig({ tags: [], types: [], statuses: [], limit: null })} className="reviewhubpage-style-76"  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                                    className="reviewhubpage-style-77" style={{
  background: hasCustomFilters && customDeckMatchCount > 0 ? '#8b5cf6' : 'var(--color-border)',
  color: hasCustomFilters && customDeckMatchCount > 0 ? 'white' : 'var(--color-text-muted)',
  cursor: hasCustomFilters && customDeckMatchCount > 0 ? 'pointer' : 'not-allowed',
  boxShadow: hasCustomFilters && customDeckMatchCount > 0 ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
  opacity: hasCustomFilters && customDeckMatchCount > 0 ? 1 : 0.6
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
        className="reviewhubpage-style-78" style={{
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
        <div className="reviewhubpage-style-79" >
            <div className="reviewhubpage-style-80" >
                <div className="reviewhubpage-style-81" style={{
  background: badgeBg,
  color: iconColor
}}>
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
                </div>
                <div>
                    <div className="reviewhubpage-style-82" style={{
  color: badgeColor
}}>
                        {badge}
                    </div>
                    <div className="reviewhubpage-style-83" >{title}</div>
                </div>
            </div>
            {disabled && <LockKey size={14} className="reviewhubpage-style-84"  />}
        </div>

        <p className="reviewhubpage-style-85" >
            {description}
        </p>

        {children}
        
        <div className="reviewhubpage-style-86" >
            <button
                onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
                disabled={disabled}
                className="reviewhubpage-style-87" style={{
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
  cursor: disabled ? 'not-allowed' : 'pointer'
}}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = iconColor; }}
                onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = 'var(--color-text)'; }}
            >
                {actionLabel}
                {!disabled && <span className="reviewhubpage-style-88" >→</span>}
            </button>
        </div>
    </div>
);
