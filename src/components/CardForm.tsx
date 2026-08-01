import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    FloppyDisk,
    CaretDown,
    ArrowLeft,
    Tag,
    Stack,
    LinkSimple,
    MagnifyingGlass,
    X,
    ImageSquare,
    UploadSimple
} from '@phosphor-icons/react';
import type { Card } from '../types';
import { COURSE_TYPE, CARD_TYPES, generateId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CourseEditor } from './CourseEditor';
import { TagInput } from './card-form/TagInput';
import { FlashcardEditor } from './card-form/FlashcardEditor';
import { CardHistoryModal } from './CardHistoryModal';

interface CardFormProps {
    card?: Card | null;
    existingCards: Card[];
    onSave: (card: Card) => void;
    onCancel: () => void;
    onPause?: (card: Partial<Card>) => void;
    hideCourseOption?: boolean;
    initialNodeType?: 'course' | 'concept' | 'flashcard';
    headerCenterContent?: React.ReactNode;
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards, onSave, onCancel, onPause, hideCourseOption, initialNodeType, headerCenterContent }) => {
    const { getCategoryColor } = useTheme();
    const [showHistory, setShowHistory] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Card>>({
        type: 'drug',
        nodeType: initialNodeType || 'concept',
        format: 'q&a',
        title: '',
        subtitle: '',
        content: '', 
        tags: [],
        details: '',
        manualConnections: [],
        suppressedConnections: [],
        imageUrl: ''
    });

    // Local UI State
    const [connectionSearch, setConnectionSearch] = useState('');
    // Category Management
    const [isCustomTypeActive, setIsCustomTypeActive] = useState(
        card ? !CARD_TYPES.includes(card.type as any) && card.type !== COURSE_TYPE : false
    );
    const [customTypeInput, setCustomTypeInput] = useState('');

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        existingCards.forEach(c => c.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [existingCards]);

    const allCategories = useMemo(() => {
        const cats = new Set<string>(CARD_TYPES);
        if (card) cats.add(card.type);
        existingCards.forEach(c => cats.add(c.type));
        
        if (hideCourseOption) cats.delete(COURSE_TYPE);
        
        return Array.from(cats).sort();
    }, [existingCards, card, hideCourseOption]);

    const formDataRef = useRef(formData);
    const isExplicitlyClosedRef = useRef(false);
    const onPauseRef = useRef(onPause);

    useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

    useEffect(() => {
        formDataRef.current = formData;
        const timeout = setTimeout(() => {
            if (onPauseRef.current && !isExplicitlyClosedRef.current && (formData.title || formData.content || formData.details)) {
                onPauseRef.current(formData);
            }
        }, 1500);
        return () => clearTimeout(timeout);
    }, [formData]);

    useEffect(() => {
        return () => {
            if (!isExplicitlyClosedRef.current && onPauseRef.current && (formDataRef.current.title || formDataRef.current.content || formDataRef.current.details)) {
                onPauseRef.current(formDataRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (card) {
            setFormData(card);
            if (!CARD_TYPES.includes(card.type as any) && card.type !== COURSE_TYPE) {
                setIsCustomTypeActive(true);
                setCustomTypeInput(card.type);
            }
        }
    }, [card]);

    const handleSave = () => {
        isExplicitlyClosedRef.current = true;
        const finalCard: Card = {
            id: formData.id || generateId(),
            type: formData.type || 'drug',
            nodeType: formData.nodeType || 'concept',
            format: formData.format || 'q&a',
            title: formData.title || '',
            subtitle: formData.subtitle || '',
            content: formData.content || '',
            tags: formData.tags || [],
            details: formData.details || '',
            manualConnections: formData.manualConnections || [],
            suppressedConnections: formData.suppressedConnections || [],
            parentId: formData.parentId,
            imageUrl: formData.imageUrl,
            createdAt: formData.createdAt || Date.now(),
            updatedAt: Date.now(),
        };
        onSave(finalCard);
    };

    const addTag = (tag: string) => {
        if (!formData.tags?.includes(tag)) {
            setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
        }
    };
    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) || [] });
    };

    const connectionCandidates = useMemo(() => {
        if (!connectionSearch.trim()) return [];
        const s = connectionSearch.toLowerCase();
        return existingCards
            .filter(c => c.id !== formData.id)
            .filter(c => !formData.manualConnections?.includes(c.id))
            .filter(c => c.title?.toLowerCase().includes(s) || c.content?.toLowerCase().includes(s))
            .slice(0, 5);
    }, [connectionSearch, existingCards, formData.id, formData.manualConnections]);

    const toggleConnection = (id: string) => {
        const curr = formData.manualConnections || [];
        if (curr.includes(id)) {
            setFormData({ ...formData, manualConnections: curr.filter(x => x !== id) });
        } else {
            setFormData({ ...formData, manualConnections: [...curr, id] });
            setConnectionSearch('');
        }
    };

    const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomTypeInput(val);
        setFormData({ ...formData, type: val });
    };

    const categoryColor = getCategoryColor(isCustomTypeActive ? customTypeInput : (formData.type || 'drug'));

    return (
    <>
        <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950">
            
            {/* SUB-HEADER: Toolbar for Actions */}
            <div className="h-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-12 shrink-0 z-10">
                <button onClick={onCancel} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-colors px-4 py-2 rounded-xl hover:bg-white dark:bg-slate-900 border-none outline-none cursor-pointer bg-transparent">
                    <ArrowLeft size={18} weight="bold" />
                    Retour au deck
                </button>
                
                {headerCenterContent && (
                    <div className="hidden md:flex flex-1 justify-center">
                        {headerCenterContent}
                    </div>
                )}
                
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:block">
                        Non enregistré
                    </span>
                    <button 
                        onClick={handleSave} 
                        disabled={(!formData.title?.trim() && formData.nodeType !== 'flashcard') || (formData.nodeType === 'flashcard' && !formData.content?.trim())} 
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-sm transition-all border-none outline-none cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FloppyDisk size={18} weight="fill" />
                        Enregistrer
                    </button>
                </div>
            </div>

            {/* MAIN: Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative w-full flex justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
                
                <div className="w-full max-w-3xl flex flex-col gap-6 relative">
                    
                    {/* FLOATING SELECTORS */}
                    <div className="flex items-center justify-between mb-2">
                        {/* Type/Category Selector */}
                        <div className="flex items-center relative group">
                            <select
                                value={isCustomTypeActive ? '__custom__' : (formData.type || '')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__custom__') {
                                        setIsCustomTypeActive(true);
                                        setFormData({ ...formData, type: customTypeInput || '' });
                                    } else {
                                        setIsCustomTypeActive(false);
                                        setCustomTypeInput('');
                                        setFormData({ ...formData, type: val });
                                    }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            >
                                {[...allCategories].sort((a, b) => a.localeCompare(b)).map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                                <option value="__custom__">Autre / Nouveau...</option>
                            </select>

                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 shadow-sm" style={{ color: categoryColor }}>
                                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: categoryColor }}></div>
                                {isCustomTypeActive ? customTypeInput || 'Catégorie...' : formData.type}
                                <CaretDown size={14} weight="bold" className="ml-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:text-slate-100 transition-colors" />
                            </div>

                            {isCustomTypeActive && (
                                <input
                                    type="text"
                                    value={customTypeInput}
                                    onChange={handleCustomTypeChange}
                                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                    placeholder="Nouvelle..."
                                    autoFocus
                                    className="ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 text-[13px] outline-none w-[140px] font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500/50 transition-colors"
                                />
                            )}
                        </div>
                        
                        {/* Format Toggle for Flashcards (Text / Q&A) */}
                        {formData.nodeType === 'flashcard' && (
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto mb-4">
                                <button 
                                    onClick={() => setFormData({ ...formData, format: 'cloze' })}
                                    className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all duration-200 border-none outline-none cursor-pointer font-medium ${formData.format === 'cloze' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    Texte à trous
                                </button>
                                <button 
                                    onClick={() => setFormData({ ...formData, format: 'q&a' })}
                                    className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all duration-200 border-none outline-none cursor-pointer font-medium ${formData.format === 'q&a' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    Q / R
                                </button>
                            </div>
                        )}
                        
                        {/* Parent Course Selector */}
                        <div className="relative">
                            <select
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={formData.parentId || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || undefined }))}
                            >
                                <option value="">Aucun cours parent</option>
                                {existingCards
                                    .filter(c => c.nodeType === 'course' && c.id !== card?.id) // Prevent self-referencing
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.title || 'Cours sans titre'}</option>
                                    ))}
                            </select>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.05em] transition-all cursor-pointer border border-transparent outline-none bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20">
                                <Stack size={16} weight="duotone" className="shrink-0" />
                                {formData.parentId 
                                    ? existingCards.find(c => c.id === formData.parentId)?.title || 'Cours inconnu' 
                                    : 'Lier à un cours...'}
                                <CaretDown size={14} weight="bold" className="ml-1 opacity-70" />
                            </button>
                        </div>
                    </div>

                    {/* MAIN CARD (Title & Content) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-card border border-slate-200 dark:border-slate-700 p-8 md:p-10 flex flex-col relative z-10 min-h-[400px]">
                        
                        {/* Title & Subtitle */}
                        {formData.nodeType !== 'flashcard' && (
                            <div className="mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-6">
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={formData.nodeType === 'course' ? "Titre du cours..." : "Titre du concept..."}
                                    className="w-full bg-transparent border-none outline-none text-[32px] md:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-2 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-0 p-0"
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="Sous-titre ou contexte (optionnel)..."
                                    className="w-full bg-transparent border-none outline-none text-base md:text-lg font-medium text-slate-500 dark:text-slate-400 placeholder-slate-400/80 focus:ring-0 p-0"
                                />
                            </div>
                        )}

                        {/* Editor Content Area */}
                        <div className="relative flex-1 group flex flex-col w-full h-full">
                            {formData.nodeType === 'flashcard' ? (
                                <FlashcardEditor formData={formData} setFormData={setFormData} existingCards={existingCards} />
                            ) : (
                                <CourseEditor
                                    value={formData.details || ''}
                                    onChange={(val) => setFormData({ ...formData, details: val })}
                                    existingCards={existingCards}
                                />
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col mb-8">
                        
                        {/* Tags Row */}
                        <div className="flex flex-col sm:flex-row border-b border-slate-200 dark:border-slate-700/70 min-h-[50px]">
                            <div className="w-full sm:w-1/3 px-6 py-4 bg-slate-50 dark:bg-slate-950/30 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/70 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Tag size={16} weight="duotone" />
                                Tags de la fiche
                            </div>
                            <div className="w-full sm:w-2/3 flex items-center px-6 py-4">
                                <TagInput
                                    tags={formData.tags || []}
                                    uniqueTags={uniqueTags}
                                    onAddTag={addTag}
                                    onRemoveTag={removeTag}
                                />
                            </div>
                        </div>

                        {/* Connections Row */}
                        <div className="flex flex-col sm:flex-row border-b border-slate-200 dark:border-slate-700/70 min-h-[50px]">
                            <div className="w-full sm:w-1/3 px-6 py-4 bg-slate-50 dark:bg-slate-950/30 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/70 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <LinkSimple size={16} weight="duotone" />
                                Fiches liées
                            </div>
                            <div className="w-full sm:w-2/3 flex flex-col justify-center bg-transparent group focus-within:bg-slate-50 dark:bg-slate-950/30 transition-colors">
                                <div className="flex items-center gap-3 px-6 py-4 w-full">
                                    <MagnifyingGlass size={16} className="text-slate-500 dark:text-slate-400 shrink-0 group-focus-within:text-emerald-500 transition-colors" />
                                    <input type="text" placeholder="Rechercher une fiche à lier..." value={connectionSearch} onChange={e => setConnectionSearch(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" />
                                </div>
                                
                                {connectionCandidates.length > 0 && (
                                    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50 overflow-y-auto max-h-40 custom-scrollbar z-20">
                                        {connectionCandidates.map(c => (
                                            <div key={c.id} onClick={() => toggleConnection(c.id)} className="py-2.5 px-6 cursor-pointer flex items-center gap-3 text-sm border-b border-slate-200 dark:border-slate-700/30 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-950 transition-colors last:border-none">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCategoryColor(c.type) }} />
                                                <span className="font-medium">{c.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {(formData.manualConnections?.length ?? 0) > 0 && (
                                    <div className="flex flex-wrap gap-2 px-6 pb-4">
                                        {formData.manualConnections?.map(id => {
                                            const l = existingCards.find(c => c.id === id);
                                            return l ? (
                                                <span key={id} className="text-[13px] py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md flex items-center gap-2 text-slate-900 dark:text-slate-100 font-medium shadow-sm hover:border-red-400/50 transition-colors group/pill cursor-pointer" onClick={() => toggleConnection(id)}>
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColor(l.type) }} />
                                                    {l.title}
                                                    <X size={12} weight="bold" className="text-slate-500 dark:text-slate-400 group-hover/pill:text-red-500 transition-colors" />
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Row */}
                        <div className="flex flex-col sm:flex-row min-h-[50px]">
                            <div className="w-full sm:w-1/3 px-6 py-4 bg-slate-50 dark:bg-slate-950/30 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/70 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <ImageSquare size={16} weight="duotone" />
                                Image (URL)
                            </div>
                            <div className="w-full sm:w-2/3 flex flex-col justify-center bg-transparent group focus-within:bg-slate-50 dark:bg-slate-950/30 transition-colors">
                                <div className="flex items-center gap-3 px-6 py-4 w-full">
                                    <UploadSimple size={16} className="text-slate-500 dark:text-slate-400 shrink-0 group-focus-within:text-blue-500 transition-colors" />
                                    <input type="text" placeholder="https://..." value={formData.imageUrl || ''} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" />
                                </div>
                                {formData.imageUrl && (
                                    <div className="px-6 pb-6">
                                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center relative group/img">
                                            <img src={formData.imageUrl} alt="Preview" className="max-h-[140px] mx-auto rounded-lg object-contain block shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                    {/* Bottom padding space */}
                    <div className="h-10 shrink-0"></div>
                </div>
            </main>
        </div>

        {showHistory && card && (
            <CardHistoryModal card={card} onClose={() => setShowHistory(false)} />
        )}
    </>
    );
};

export const CardForm: React.FC<CardFormProps> = (props) => {
    return <CardFormContent {...props} />;
};
