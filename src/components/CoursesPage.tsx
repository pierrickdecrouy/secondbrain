import React, { useState, useMemo } from 'react';
import {
    BookOpen, Plus, Trash,
    MagnifyingGlass, PencilSimple
} from '@phosphor-icons/react';
import { CheckCircle2, LayoutGrid, List, Flame } from 'lucide-react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
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

const CourseCard: React.FC<{ 
  course: Card; 
  onClick: () => void; 
  onEdit: () => void; 
  onDelete: () => void; 
  progress: { total: number; reviewed: number; percentage: number } | null;
  viewMode: 'grid' | 'list';
}> = ({ course, onClick, onEdit, onDelete, progress, viewMode }) => {
  const isComplete = progress?.percentage === 100;
  const hasDueCards = false; 
  const flashCount = progress?.total || 0;
  const pct = progress?.percentage || 0;

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[12px] p-4 hover:shadow-md hover:border-teal-600 dark:border-teal-500/50 transition-all duration-200 cursor-pointer mb-3"
      >
        <div className="flex-1 min-w-0 pr-4 mb-4 sm:mb-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:text-teal-400 transition-colors">
              {course.title || 'Sans titre'}
            </h3>
            {course.tags && course.tags.length > 0 && (
              <div className="flex gap-1 hidden sm:flex">
                {course.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[6px] text-[10px] font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {flashCount} éléments</span>
            <span>•</span>
            <span>{formatElapsed(course.updatedAt || Date.now())}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 pr-4 sm:pr-6 sm:border-r border-slate-200 dark:border-slate-700/50 sm:mr-6 w-full sm:w-auto justify-between sm:justify-end">
           <div className="flex flex-col items-start sm:items-end w-32">
              <div className="flex justify-between w-full text-xs font-bold mb-1.5">
                 <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Progression</span>
                 <span className={isComplete ? 'text-emerald-500' : 'text-teal-600 dark:text-teal-400'}>{Math.round(pct)}%</span>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-[6px] h-1.5 overflow-hidden border border-slate-200 dark:border-slate-700/50">
                  <div 
                    className={`h-full rounded-[6px] transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-teal-600 dark:bg-teal-500'}`}
                    style={{ width: `${pct}%` }}
                  ></div>
              </div>
           </div>
           
           <div className="w-24 flex justify-end hidden sm:flex">
              {hasDueCards ? (
                <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-[6px] shadow-sm">
                  <Flame size={14} className="mr-1" />
                  À réviser
                </div>
              ) : (
                <div className="flex items-center text-teal-600 dark:text-teal-400 text-xs font-bold bg-teal-600 dark:bg-teal-500/10 border border-teal-600 dark:border-teal-500/20 px-2 py-1 rounded-[6px]">
                  <CheckCircle2 size={14} className="mr-1" />
                  À jour
                </div>
              )}
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 absolute top-4 right-4 sm:relative sm:top-0 sm:right-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:text-teal-400 bg-transparent sm:hover:bg-teal-600 dark:bg-teal-500/10 p-2 rounded-[8px] border border-transparent sm:hover:border-teal-600 dark:border-teal-500/20 transition-all"
            title="Modifier le cours"
          >
            <PencilSimple size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="text-slate-500 dark:text-slate-400 hover:text-red-500 bg-transparent sm:hover:bg-red-50 p-2 rounded-[8px] border border-transparent sm:hover:border-red-200 transition-all"
            title="Supprimer le cours"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>
    );
  }

  // GRID MODE
  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-teal-600 dark:border-teal-500/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      {/* Ligne décorative en haut */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isComplete ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-teal-600 dark:bg-teal-500/50 transition-colors'}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          {(course.tags || []).slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[6px] text-xs font-bold uppercase tracking-wider">
              {tag}
            </span>
          ))}
          {course.subject && (
            <span className="px-2.5 py-1 bg-teal-600 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-500/20 rounded-[6px] text-xs font-bold uppercase tracking-wider">
              {course.subject}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:text-teal-400 transition-colors p-1.5 rounded-[6px] hover:bg-slate-50 dark:bg-slate-950 border border-transparent hover:border-slate-200 dark:border-slate-700">
              <PencilSimple size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50 border border-transparent hover:border-red-200">
              <Trash size={16} />
            </button>
        </div>
      </div>

      <div className="mb-6 flex-grow">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-teal-600 dark:text-teal-400 transition-colors line-clamp-2">
          {course.title || 'Sans titre'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-2">
          <BookOpen size={14} className="opacity-70" />
          {flashCount > 0 ? `${flashCount} concepts/flashcards` : 'Aucun contenu'} • {formatElapsed(course.updatedAt || Date.now())}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {hasDueCards ? (
              <div className="flex items-center text-amber-600 text-sm font-semibold bg-amber-50 px-2 py-0.5 rounded-[6px] border border-amber-200">
                <Flame size={14} className="mr-1" />
                À réviser
              </div>
            ) : (
              <div className="flex items-center text-teal-600 dark:text-teal-400 text-sm font-medium bg-teal-600 dark:bg-teal-500/10 px-2 py-1 rounded-[6px] border border-teal-600 dark:border-teal-500/20">
                <CheckCircle2 size={14} className="mr-1.5" />
                {pct > 0 ? 'En cours' : 'Non commencé'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Mémorisation</span>
            <span className={isComplete ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}>{pct}%</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-700/50">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-teal-600 dark:bg-teal-500'}`}
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTag, setSelectedTag] = useState<string>('Tous');
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
        return ['Tous', ...Array.from(tags).sort()];
    }, [courseCards]);

    const getCourseProgress = (courseId: string) => {
        const flashcards = cards.filter(c => c.nodeType === 'flashcard' && c.parentId === courseId);
        if (flashcards.length === 0) return null;
        const reviewed = flashcards.filter(c => c.progress && c.progress.status !== 'new').length;
        return { total: flashcards.length, reviewed, percentage: Math.round((reviewed / flashcards.length) * 100) };
    };

    const filteredCourses = useMemo(() => {
        let result = courseCards;
        if (selectedTag !== 'Tous') result = result.filter(c => c.tags?.includes(selectedTag));
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
                        onEdit={() => { setViewingConcept(null); setIsCreating(false); setEditingCourse(viewingConcept); }}
                    />
                )}
            </>
        );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                Fiches de cours
                <span className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-sm font-bold px-2.5 py-0.5 rounded-[8px] align-middle">
                  {courseCards.length}
                </span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-600 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-600 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'}`}
                >
                  <List size={18} />
                </button>
              </div>
              <button onClick={handleCreate} className="flex items-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm shadow-teal-500/20 dark:shadow-teal-900/20/20 transition-all active:scale-95">
                <Plus size={18} />
                Nouveau cours
              </button>
            </div>
          </div>
  
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-5 mb-8">
            <div className="relative max-w-sm w-full">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un cours..." 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[12px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-600 dark:border-teal-500 focus:ring-2 focus:ring-teal-600 dark:ring-teal-500/20 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2.5 flex-1 items-center">
              {allTags.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedTag(filter)}
                  className={`px-4 py-2 rounded-[12px] text-sm font-bold transition-all ${
                    selectedTag === filter 
                      ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md border border-teal-600 dark:border-teal-500' 
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-teal-600 dark:border-teal-500/50 hover:text-slate-900 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
  
          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className={`grid ${viewMode === 'grid' ? 'gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'gap-0 grid-cols-1 max-w-5xl'}`}>
              {filteredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onClick={() => handleView(course)}
                  onEdit={() => handleEdit(course)}
                  onDelete={() => onDeleteCourse(course)}
                  progress={getCourseProgress(course.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-full mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <BookOpen size={48} className="text-slate-500 dark:text-slate-400 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {search || selectedTag !== 'Tous' ? 'Aucun cours trouvé' : 'Aucun cours pour l\'instant'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                {search || selectedTag !== 'Tous'
                    ? 'Modifiez votre recherche ou vos filtres.'
                    : 'Créez votre premier cours pour commencer à structurer votre base de connaissances.'}
              </p>
              {!search && selectedTag === 'Tous' && (
                  <button onClick={handleCreate} className="flex items-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-95" >
                      <Plus size={18} weight="bold" />
                      Créer un cours
                  </button>
              )}
            </div>
          )}
  
        </main>
      </div>
    );
};
