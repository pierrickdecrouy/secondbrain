import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CaretLeft, FileText, Stack, UploadSimple, FloppyDisk,
    CaretDown, Info, WarningCircle, Brain,
    Pill
} from '@phosphor-icons/react';
import { toast } from '../store/useToastStore';
import { TipTapEditor } from './editor/TipTapEditor';
import { BatchImportContent } from './BatchImportModal';
import type { Card, CardType, NodeType } from '../types';
import { generateId } from '../types';
import { Dropdown } from './ui/Dropdown';
import { CARD_TEXT_COLORS as CATEGORY_COLORS } from '../theme';

interface AddDataPageProps {
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
}

const CATEGORY_ICONS: Record<CardType, React.ReactNode> = {
    drug: <Pill size={20} weight="fill" />,
    patho: <WarningCircle size={20} weight="fill" />,
    physio: <Brain size={20} weight="fill" />,
    data: <Info size={20} weight="fill" />,
    misc: <FileText size={20} weight="fill" />
};


export const AddDataPage: React.FC<AddDataPageProps> = ({ existingCards = [], onSave, onImport }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'concept' | 'flashcard' | 'import'>('concept');
    
    // Editor State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [details, setDetails] = useState(''); // Markdown content from TipTap
    const [selectedType, setSelectedType] = useState<CardType>('misc');
    const [parentCourseId, setParentCourseId] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [titleError, setTitleError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const handleBack = () => navigate(-1);

    useEffect(() => {
        titleInputRef.current?.focus();
    }, [activeTab]);

    const courses = useMemo(() => existingCards.filter(c => c.nodeType === 'course'), [existingCards]);
    const selectedCourse = courses.find(c => c.id === parentCourseId);

    const typeOptions = useMemo(() => {
        return (['drug', 'patho', 'physio', 'data', 'misc'] as CardType[]).map(type => ({
            id: type,
            label: type,
            icon: CATEGORY_ICONS[type],
            colorClass: CATEGORY_COLORS[type]
        }));
    }, []);

    const courseOptions = useMemo(() => {
        return courses.map(course => ({
            id: course.id,
            label: (
                <div className="flex flex-col w-full">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate w-full">{course.title}</span>
                    {course.subject && <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{course.subject}</span>}
                </div>
            )
        }));
    }, [courses]);

    const handleSave = async () => {
        if (isSaving) return;
        if (!title.trim()) {
            setTitleError('Le titre est requis');
            toast.error('Le titre est requis');
            titleInputRef.current?.focus();
            return;
        }
        setTitleError(null);
        setIsSaving(true);

        const newCard: Card = {
            id: generateId(),
            title: title.trim(),
            subtitle: subtitle.trim(),
            content: '', // For now, we only use details for the main content
            details: details,
            type: selectedType,
            nodeType: activeTab as NodeType,
            tags: tags,
            parentId: parentCourseId || undefined,
            history: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (activeTab === 'flashcard') {
            newCard.format = 'q&a'; // basic format
        }

        try {
            await Promise.resolve(onSave(newCard));
            toast.success('Contenu enregistré');
            handleBack();
        } catch {
            toast.error("Impossible d'enregistrer. Réessayez.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().toLowerCase();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-[#09090b] text-slate-800 dark:text-slate-100 font-sans">
            
            {/* TOP HEADER */}
            <header className="h-[72px] bg-transparent flex items-center justify-between px-4 md:px-10 z-40 shrink-0 transition-all relative">
                
                <div className="w-1/4">
                    <button onClick={handleBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 text-sm font-bold transition-colors group bg-transparent border-none outline-none cursor-pointer p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <CaretLeft size={18} weight="bold" className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                        <span className="hidden md:inline">Retour au deck</span>
                    </button>
                </div>

                {/* Menus centraux épurés */}
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center bg-slate-50/80 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-x-1 shadow-sm">
                        
                        <button 
                            onClick={() => setActiveTab('concept')}
                            className={`flex items-center space-x-2.5 px-3 md:px-4 py-1.5 rounded-xl transition-all duration-200 border-none outline-none cursor-pointer ${
                                activeTab === 'concept' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                            }`}
                        >
                            <FileText size={16} weight={activeTab === 'concept' ? 'fill' : 'bold'} className={activeTab === 'concept' ? 'text-amber-500' : 'text-slate-400'} />
                            <div className="hidden md:flex flex-col items-start text-[13px] font-bold leading-tight">
                                <span>Nouveau</span>
                                <span>Concept</span>
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('flashcard')}
                            className={`flex items-center space-x-2.5 px-3 md:px-4 py-1.5 rounded-xl transition-all duration-200 border-none outline-none cursor-pointer ${
                                activeTab === 'flashcard' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                            }`}
                        >
                            <Stack size={16} weight={activeTab === 'flashcard' ? 'fill' : 'bold'} className={activeTab === 'flashcard' ? 'text-blue-500' : 'text-slate-400'}/>
                            <div className="hidden md:flex flex-col items-start text-[13px] font-bold leading-tight">
                                <span>Nouvelle</span>
                                <span>Flashcard</span>
                            </div>
                        </button>
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        
                        <button 
                            onClick={() => setActiveTab('import')}
                            className={`flex items-center space-x-2.5 px-3 md:px-4 py-1.5 rounded-xl transition-all duration-200 border-none outline-none cursor-pointer ${
                                activeTab === 'import' ? 'bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 border-transparent'
                            }`}
                        >
                            <UploadSimple size={16} weight={activeTab === 'import' ? 'fill' : 'bold'} className={activeTab === 'import' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}/>
                            <div className="hidden md:flex flex-col items-start text-[13px] font-bold leading-tight">
                                <span>Import</span>
                                <span>Massif</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Action Right */}
                <div className="w-1/4 flex items-center justify-end space-x-5">
                    {activeTab !== 'import' && (
                        <>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {title || details ? 'Non enregistré' : 'Nouveau'}
                            </span>
                            <button 
                                onClick={handleSave}
                            disabled={!title.trim() || isSaving}
                                className="flex items-center space-x-2 bg-[#818CF8] hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 md:px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 border-none outline-none cursor-pointer"
                            >
                                <FloppyDisk size={16} weight="bold" />
                            <span className="hidden md:inline">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* CONTENU DYNAMIQUE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab !== 'import' ? (
                    <div className="max-w-3xl mx-auto w-full flex flex-col pt-16 lg:pt-24 pb-32 px-8 min-h-full relative">
                        
                        {/* Métadonnées (Top Tags) */}
                        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 mb-6 md:mb-8 w-full">
                            <Dropdown
                                value={selectedType}
                                onChange={(v) => setSelectedType(v as CardType)}
                                options={typeOptions}
                                renderTrigger={(selectedItem) => (
                                    <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-sm transition-all group outline-none">
                                        <div className={selectedItem?.colorClass}>
                                            {selectedItem?.icon}
                                        </div>
                                        <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                                            {selectedItem?.label}
                                        </span>
                                        <CaretDown size={14} weight="bold" className="text-slate-400" />
                                    </div>
                                )}
                            />

                            <Dropdown
                                value={parentCourseId}
                                onChange={setParentCourseId}
                                options={courseOptions}
                                placeholder="Lier à un cours..."
                                showClearButton={true}
                                onClear={() => setParentCourseId('')}
                                renderTrigger={() => (
                                    <div className={`flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm transition-all outline-none ${parentCourseId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        <Stack size={16} weight={parentCourseId ? "fill" : "bold"} />
                                        <span className="text-sm font-bold">
                                            {selectedCourse ? selectedCourse.title : 'Lier à un cours...'}
                                        </span>
                                        {parentCourseId ? (
                                            <div 
                                                className="ml-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded p-0.5" 
                                                onClick={(e) => { e.stopPropagation(); setParentCourseId(''); }}
                                            >
                                                &times;
                                            </div>
                                        ) : (
                                            <CaretDown size={14} weight="bold" className="text-slate-400" />
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Titre et Sous-titre */}
                        <div className="mb-6 flex flex-col space-y-4">
                            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                                Champ principal requis
                            </p>
                            <input 
                                ref={titleInputRef}
                                type="text" 
                                placeholder={activeTab === 'flashcard' ? "Question de la flashcard..." : "Titre du concept..."}
                                value={title}
                                onChange={e => {
                                    setTitle(e.target.value);
                                    if (titleError && e.target.value.trim()) setTitleError(null);
                                }}
                                aria-invalid={!!titleError}
                                aria-describedby={titleError ? 'title-error' : undefined}
                                className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 bg-transparent border-none outline-none w-full leading-tight"
                            />
                            {titleError && (
                                <p id="title-error" className="text-sm font-semibold text-red-500 m-0">
                                    {titleError}
                                </p>
                            )}
                            <input 
                                type="text" 
                                placeholder="Sous-titre ou contexte (optionnel)..." 
                                value={subtitle}
                                onChange={e => setSubtitle(e.target.value)}
                                className="text-xl font-medium text-slate-500 dark:text-slate-400 placeholder-slate-300 dark:placeholder-slate-700 bg-transparent border-none outline-none w-full"
                            />
                            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                                Le sous-titre, les tags et le lien de cours sont optionnels.
                            </p>
                        </div>

                        {/* Zone de texte principale (Extensible via TipTap) */}
                        <div className="flex-1 w-full flex flex-col relative">
                            <TipTapEditor 
                                value={details} 
                                onChange={setDetails} 
                                placeholder={activeTab === 'flashcard' ? "Réponse (Markdown supporté)..." : "Commencez à écrire ici (Markdown supporté)..."} 
                            />
                        </div>

                    </div>
                ) : (
                    // VUE IMPORT MASSIF
                    <div className="w-full h-full p-4 lg:p-8">
                        <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm bg-white dark:bg-[#09090b]">
                            <BatchImportContent onImport={onImport} onClose={handleBack} existingCards={existingCards} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* FOOTER TAGS (Seulement visible si pas import) */}
            {activeTab !== 'import' && (
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 p-4 shrink-0 flex justify-center z-30 relative pb-[calc(1rem+68px+env(safe-area-inset-bottom))] md:pb-4">
                    <div className="w-full max-w-4xl flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 border-r border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider shrink-0">
                            <Info size={14} className="rotate-180" weight="bold" />
                            <span>TAGS</span>
                        </div>
                        <div className="flex-1 flex items-center flex-wrap gap-1 px-3 py-1.5 min-h-[44px]">
                            {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md text-xs font-bold">
                                    #{tag}
                                    <button 
                                        onClick={() => removeTag(tag)}
                                        className="hover:bg-indigo-200 dark:hover:bg-indigo-500/20 rounded-full p-0.5 ml-0.5 outline-none border-none bg-transparent cursor-pointer transition-colors"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                            <input 
                                type="text"
                                placeholder={tags.length === 0 ? "+ Tag (Entrée pour valider)" : ""}
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 py-1"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
