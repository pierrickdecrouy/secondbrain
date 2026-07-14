import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    X,
    FloppyDisk,
    MagnifyingGlass,
    EyeSlash,
    UploadSimple,
    Info,
    ClockCounterClockwise
} from '@phosphor-icons/react';
import type { Card, CardType } from '../types';
import { COURSE_TYPE, CARD_TYPES, generateId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { toast } from '../store/useToastStore';
import { CourseEditor } from './CourseEditor';
import { TagInput } from './card-form/TagInput';
import { FlashcardEditor } from './card-form/FlashcardEditor';
import { CardHistoryModal } from './CardHistoryModal';
import './CardForm.css';

interface CardFormProps {
    card?: Card | null;
    existingCards: Card[];
    onSave: (card: Card) => void;
    onCancel: () => void;
    onPause?: (card: Partial<Card>) => void;
    hideCourseOption?: boolean;
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards, onSave, onCancel, onPause, hideCourseOption }) => {
    const { getCategoryColor } = useTheme();
    const [showHistory, setShowHistory] = useState(false);


    // Form State
    const [formData, setFormData] = useState<Partial<Card>>({
        type: 'drug',
        nodeType: 'concept',
        title: '',
        subtitle: '',
        content: '', // Summary
        tags: [],
        details: '', // Markdown Content
        manualConnections: [],
        suppressedConnections: [],
        imageUrl: ''
    });

    // Local UI State
    const [connectionSearch, setConnectionSearch] = useState('');
    const [suppressSearch, setSuppressSearch] = useState('');
    const [showMarkdownInfo, setShowMarkdownInfo] = useState(false);



    // Category Management
    const [isCustomTypeActive, setIsCustomTypeActive] = useState(
        card ? !CARD_TYPES.includes(card.type as any) && card.type !== COURSE_TYPE : false
    );
    const [customTypeInput, setCustomTypeInput] = useState('');

    // Tag Management
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        existingCards.forEach(c => c.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [existingCards]);

    // Category Management (derived from existing + default)
    const allCategories = useMemo(() => {
        const cats = new Set<string>(CARD_TYPES);
        if (card) cats.add(card.type);
        existingCards.forEach(c => cats.add(c.type));
        
        if (hideCourseOption) {
            cats.delete(COURSE_TYPE);
        }
        
        return Array.from(cats).sort();
    }, [existingCards, card, hideCourseOption]);

    // Auto-save logic
    const formDataRef = useRef(formData);
    const isExplicitlyClosedRef = useRef(false);
    const onPauseRef = useRef(onPause);

    useEffect(() => {
        onPauseRef.current = onPause;
    }, [onPause]);

    useEffect(() => {
        formDataRef.current = formData;
        // Optional: Debounced auto-save while typing
        const timeout = setTimeout(() => {
            if (onPauseRef.current && !isExplicitlyClosedRef.current && (formData.title || formData.content || formData.details)) {
                onPauseRef.current(formData);
            }
        }, 1500);
        return () => clearTimeout(timeout);
    }, [formData]);

    // Unmount auto-save
    useEffect(() => {
        return () => {
            if (!isExplicitlyClosedRef.current && onPauseRef.current && (formDataRef.current.title || formDataRef.current.content || formDataRef.current.details)) {
                onPauseRef.current(formDataRef.current);
            }
        };
    }, []);

    // Only trigger when content settles. Title/Type changes don't trigger re-gen to avoid spam.

    useEffect(() => {
        if (card) {
            setFormData({ ...card });
            // M-1 fix: detect custom category correctly (not just when existingCards is empty)
            const isStandardType = CARD_TYPES.includes(card.type as any);
            const isKnownType = existingCards.some(c => c.type === card.type);
            if (!isStandardType && !isKnownType) {
                setIsCustomTypeActive(true);
                setCustomTypeInput(card.type);
            } else if (!isStandardType && isKnownType) {
                // It's a custom category that already exists — keep it in dropdown
                setIsCustomTypeActive(false);
            } else {
                setIsCustomTypeActive(false);
                setCustomTypeInput('');
            }
        }
    }, [card?.id]); // Only re-run when the card changes, not on every render

    // ... (rest of derived lists)

    // Derived Lists
    const connectionCandidates = useMemo(() => {
        if (!connectionSearch) return [];
        const lower = connectionSearch.toLowerCase();
        return existingCards
            .filter(c => c.id !== card?.id && !formData.manualConnections?.includes(c.id))
            .filter(c => c.title.toLowerCase().includes(lower) || c.type.toLowerCase().includes(lower))
            .slice(0, 5);
    }, [existingCards, card, formData.manualConnections, connectionSearch]);

    const suppressionCandidates = useMemo(() => {
        if (!suppressSearch) return [];
        const lower = suppressSearch.toLowerCase();
        return existingCards
            .filter(c => c.id !== card?.id && !formData.suppressedConnections?.includes(c.id))
            .filter(c => c.title.toLowerCase().includes(lower))
            .slice(0, 5);
    }, [existingCards, card, formData.suppressedConnections, suppressSearch]);

    // Handlers
    const handleSave = useCallback(() => {
        const isCloze = formData.nodeType === 'flashcard' && formData.format === 'cloze';
        if ((!formData.title && !isCloze) || !formData.type) return;

        isExplicitlyClosedRef.current = true;
        const now = Date.now();
        const finalTitle = isCloze && !formData.title ? "Texte à trou" : formData.title;
        const newCard: Card = {
            id: card?.id || generateId(),
            type: formData.type as CardType,
            nodeType: formData.nodeType || 'concept',
            format: formData.format || 'q&a',
            parentId: formData.parentId,
            title: finalTitle || '',
            subtitle: formData.subtitle || '',
            content: formData.content || '',
            tags: formData.tags || [],
            details: formData.details || '',
            manualConnections: formData.manualConnections || [],
            suppressedConnections: formData.suppressedConnections || [],
            imageUrl: formData.imageUrl,
            createdAt: card?.createdAt || now,
            updatedAt: now
        };

        onSave(newCard);
    }, [formData, card, onSave]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const addTag = (tag: string) => {
        const t = tag.trim().toLowerCase();
        if (t && !formData.tags?.includes(t)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
        }
    };

    const removeTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(t => t !== tag)
        }));
    };

    const toggleConnection = (targetId: string) => {
        setFormData(prev => {
            const current = prev.manualConnections || [];
            if (current.includes(targetId)) {
                return { ...prev, manualConnections: current.filter(id => id !== targetId) };
            } else {
                return { ...prev, manualConnections: [...current, targetId] };
            }
        });
        setConnectionSearch('');
    };

    const toggleSuppression = (targetId: string) => {
        setFormData(prev => {
            const current = prev.suppressedConnections || [];
            if (current.includes(targetId)) {
                return { ...prev, suppressedConnections: current.filter(id => id !== targetId) };
            } else {
                return { ...prev, suppressedConnections: [...current, targetId] };
            }
        });
        setSuppressSearch('');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && window.electronAPI) {
            try {
                const buffer = await file.arrayBuffer();
                const savedPath = await (window.electronAPI as any).saveImage({
                    buffer,
                    name: file.name,
                    type: file.type
                });
                setFormData(prev => ({ ...prev, imageUrl: savedPath }));
            } catch (err) {
                console.error('Upload failed', err);
            }
        } else if (file) {
            toast.error('L\'upload nécessite l\'application Electron');
        }
    };

    const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomTypeInput(val);
        setFormData({ ...formData, type: val });
    };

    const [showAdvanced, setShowAdvanced] = useState(false);

    const categoryColor = getCategoryColor(isCustomTypeActive ? customTypeInput : (formData.type || 'drug'));

    return (
    <>
        <div className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-hidden flex flex-col min-h-0">
            {formData.nodeType === 'flashcard' ? (
                <FlashcardEditor formData={formData} setFormData={setFormData} />
            ) : (
                <>
                    {/* ── Meta bar: type + tags ─────────────── */}
                    <div className="px-10 py-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] flex items-center gap-4 shrink-0 flex-wrap">
                        {/* Category pill */}
                        <div
                            className="flex items-center gap-2 py-1.5 pr-[14px] pl-2.5 rounded-full shrink-0"
                            style={{
                                background: `${categoryColor}15`,
                                border: `1px solid ${categoryColor}35`,
                            }}
                        >
                            <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: categoryColor, boxShadow: `0 0 6px ${categoryColor}80` }} />
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
                                className="border-none bg-transparent outline-none text-[0.82rem] font-bold cursor-pointer p-0 tracking-[0.02em]"
                                style={{ color: categoryColor }}
                            >
                                {[...allCategories].sort((a, b) => a.localeCompare(b)).map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                                <option value="__custom__">Autre / Nouveau...</option>
                            </select>
                            {isCustomTypeActive && (
                                <input
                                    type="text"
                                    value={customTypeInput}
                                    onChange={handleCustomTypeChange}
                                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                    placeholder="Catégorie..."
                                    autoFocus
                                    className="border-none py-[3px] px-2 rounded-lg text-[0.82rem] outline-none w-[120px] font-semibold"
                                    style={{
                                        background: `${categoryColor}10`,
                                        color: categoryColor,
                                    }}
                                />
                            )}
                        </div>

                        {/* Tags */}
                        <TagInput
                            tags={formData.tags || []}
                            uniqueTags={uniqueTags}
                            onAddTag={addTag}
                            onRemoveTag={removeTag}
                        />

                        {/* Markdown info toggle */}
                        <button
                            onClick={() => setShowMarkdownInfo(!showMarkdownInfo)}
                            className="ml-auto flex items-center gap-1.5 rounded-lg cursor-pointer text-[0.78rem] font-medium py-[5px] px-3 transition-all duration-150 shrink-0"
                            style={{
                                background: showMarkdownInfo ? 'rgba(99,102,241,0.1)' : 'transparent',
                                border: `1px solid ${showMarkdownInfo ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                                color: showMarkdownInfo ? '#6366f1' : 'var(--color-text-muted)',
                            }}
                        >
                            <Info size={13} /> Markdown
                        </button>
                    </div>

                    {showMarkdownInfo && (
                        <div className="py-2.5 px-10 bg-[rgba(99,102,241,0.05)] border-b border-[rgba(99,102,241,0.15)] text-[0.8rem] text-indigo-500 shrink-0">
                            **Gras**, *Italique*, # Titre, - Liste, [[Lien interne]], $Équation$
                        </div>
                    )}

                    {/* ── Title area ──────────────────── */}
                    <div className="pt-10 px-10 pb-6 shrink-0">
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Titre de la fiche…"
                            className="w-full text-[2.4rem] font-extrabold border-none bg-transparent text-[color:var(--color-text)] outline-none p-0 m-0 leading-[1.15] tracking-[-0.02em]"
                            autoFocus
                        />
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="Sous-titre ou description courte (optionnel)…"
                            className="w-full mt-3 text-[1rem] bg-transparent border-none text-[color:var(--color-text-muted)] outline-none p-0 font-normal"
                        />
                    </div>

                    {/* ── Editor ───────────────────────────────── */}
                    <div className="flex-1 mx-9 mb-5 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <CourseEditor
                                value={formData.details || ''}
                                onChange={(val) => setFormData({ ...formData, details: val })}
                                existingCards={existingCards}
                            />
                        </div>
                    </div>

                    {/* ── Connections accordion ─────────────────── */}
                    <div className="px-9 pb-6 shrink-0">
                        <button
                            onClick={() => setShowAdvanced(v => !v)}
                            className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-[color:var(--color-text-muted)] text-[0.78rem] font-bold uppercase tracking-[0.06em] py-2 transition-colors duration-150 hover:text-[color:var(--color-text)]"
                            style={{ marginBottom: showAdvanced ? 16 : 0 }}
                        >
                            <span
                                className="inline-flex items-center justify-center w-4 h-4 rounded border border-[color:var(--color-border)] text-[0.55rem] transition-transform duration-200"
                                style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none' }}
                            >▶</span>
                            Connexions &amp; Image
                        </button>

                        {showAdvanced && (
                            <div className="flex flex-col gap-3.5">
                                {/* Connections row */}
                                <div className="grid grid-cols-2 gap-3.5 items-start">
                                    {/* Link connections */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[0.72rem] font-bold text-[color:var(--color-text-muted)] uppercase tracking-[0.05em]">
                                            Lier à d'autres fiches
                                        </span>
                                        <div className="flex items-center border border-[color:var(--color-border)] rounded-lg py-1.5 px-2.5 bg-[color:var(--color-bg)] gap-1.5">
                                            <MagnifyingGlass size={13} className="text-[color:var(--color-text-muted)] shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher une fiche..."
                                                value={connectionSearch}
                                                onChange={e => setConnectionSearch(e.target.value)}
                                                className="border-none bg-transparent w-full outline-none p-0 text-[0.82rem] text-[color:var(--color-text)]"
                                            />
                                        </div>
                                        {connectionCandidates.length > 0 && (
                                            <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg overflow-hidden">
                                                {connectionCandidates.map(c => (
                                                    <div key={c.id} onClick={() => toggleConnection(c.id)} className="py-[7px] px-2.5 cursor-pointer flex items-center gap-[7px] text-[0.82rem] border-b border-[color:var(--color-border)] text-[color:var(--color-text)]">
                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getCategoryColor(c.type) }} />{c.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {(formData.manualConnections?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {formData.manualConnections?.map(id => {
                                                    const l = existingCards.find(c => c.id === id);
                                                    return l ? (
                                                        <span key={id} className="text-xs py-0.5 px-2 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-md inline-flex items-center gap-1 text-[color:var(--color-text)]">
                                                            {l.title}
                                                            <X size={9} onClick={() => toggleConnection(id)} className="cursor-pointer text-[color:var(--color-text-muted)]" />
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Suppress connections */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[0.72rem] font-bold text-[color:var(--color-text-muted)] uppercase tracking-[0.05em]">
                                            Masquer des connexions
                                        </span>
                                        <div className="flex items-center border border-[color:var(--color-border)] rounded-lg py-1.5 px-2.5 bg-[color:var(--color-bg)] gap-1.5">
                                            <EyeSlash size={13} className="text-[color:var(--color-text-muted)] shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Fiche à exclure..."
                                                value={suppressSearch}
                                                onChange={e => setSuppressSearch(e.target.value)}
                                                className="border-none bg-transparent w-full outline-none p-0 text-[0.82rem] text-[color:var(--color-text)]"
                                            />
                                        </div>
                                        {suppressionCandidates.length > 0 && (
                                            <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg overflow-hidden">
                                                {suppressionCandidates.map(c => (
                                                    <div key={c.id} onClick={() => toggleSuppression(c.id)} className="py-[7px] px-2.5 cursor-pointer flex items-center gap-[7px] text-[0.82rem] border-b border-[color:var(--color-border)] text-[color:var(--color-text)]">
                                                        <EyeSlash size={11} />{c.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {(formData.suppressedConnections?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {formData.suppressedConnections?.map(id => {
                                                    const l = existingCards.find(c => c.id === id);
                                                    return l ? (
                                                        <span key={id} className="text-xs py-0.5 px-2 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-md inline-flex items-center gap-1 text-[color:var(--color-text)]">
                                                            {l.title}
                                                            <X size={9} onClick={() => toggleSuppression(id)} className="cursor-pointer text-[color:var(--color-text-muted)]" />
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Image & résumé */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[0.72rem] font-bold text-[color:var(--color-text-muted)] uppercase tracking-[0.05em]">
                                        Image &amp; Résumé court
                                    </span>
                                    <div className="flex gap-2.5 items-start">
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="flex items-center border border-[color:var(--color-border)] rounded-lg py-1.5 px-2.5 bg-[color:var(--color-bg)] gap-1.5">
                                                <input
                                                    type="text"
                                                    value={formData.imageUrl || ''}
                                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                    className="border-none bg-transparent w-full outline-none p-0 text-[0.82rem] text-[color:var(--color-text)]"
                                                    placeholder="URL de l'image..."
                                                />
                                                <label htmlFor="image-upload" className="cursor-pointer text-[color:var(--color-text-muted)] m-0 flex items-center border-l border-[color:var(--color-border)] pl-2">
                                                    <UploadSimple size={15} />
                                                    <input id="image-upload" type="file" hidden onChange={handleImageUpload} />
                                                </label>
                                            </div>
                                            <textarea
                                                value={formData.content}
                                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                                rows={2}
                                                placeholder="Bref résumé affiché dans la liste..."
                                                className="w-full py-2 px-2.5 text-[0.82rem] border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] resize-y min-h-[52px] outline-none font-inherit"
                                            />
                                        </div>
                                        {formData.imageUrl && (
                                            <div className="w-[72px] h-[72px] rounded-lg overflow-hidden border border-[color:var(--color-border)] shrink-0">
                                                <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* ── Footer ──────────────────────────────── */}
        <div className="py-4 px-10 bg-[color:var(--color-surface)] border-t border-[color:var(--color-border)] flex justify-between items-center shrink-0">
            <div className="flex gap-2.5 items-center">
                <button
                    className="py-2.5 px-5 rounded-xl font-medium cursor-pointer bg-transparent border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] text-[0.88rem] transition-all duration-150 hover:text-[color:var(--color-text)] hover:border-[color:var(--color-text-muted)]"
                    onClick={() => {
                        isExplicitlyClosedRef.current = true;
                        if (onPause && (formData.title || formData.content || formData.details)) {
                            onPause(formData);
                        }
                        onCancel();
                    }}
                >
                    Annuler
                </button>
                {card && card.history && card.history.length > 0 && (
                    <button
                        className="py-[9px] px-[14px] rounded-[10px] font-medium cursor-pointer bg-transparent border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] text-[0.88rem] flex items-center gap-1.5"
                        onClick={() => setShowHistory(true)}
                        title="Voir l'historique des modifications"
                    >
                        <ClockCounterClockwise size={16} />
                        Historique
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <kbd className="text-xs text-[color:var(--color-text-muted)] font-mono bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-md py-[3px] px-2">
                    ⌘S
                </kbd>
                <button
                    className={`py-2.5 px-7 rounded-[10px] font-bold text-[0.88rem] flex items-center gap-2 transition-all duration-150 ${((formData.title || formData.format === 'cloze') && formData.type) ? 'cursor-pointer text-white shadow-[0_4px_14px_rgba(13,148,136,0.3)] opacity-100 bg-gradient-to-br from-teal-600 to-cyan-600 border-none' : 'cursor-not-allowed bg-[color:var(--color-border)] text-[color:var(--color-text-muted)] border-none opacity-50 shadow-none'}`}
                    onClick={handleSave}
                    disabled={(!formData.title && formData.format !== 'cloze') || !formData.type}
                >
                    <FloppyDisk size={16} weight="bold" /> Enregistrer
                </button>
            </div>
        </div>

        {showHistory && card && (
            <CardHistoryModal card={card} onClose={() => setShowHistory(false)} />
        )}
    </>
);
};

export const CardForm: React.FC<CardFormProps> = (props) => {
    return (
        <div className="modal-overlay z-[1000]">
            <div className="modal-content flex flex-col p-0 max-w-[900px] h-[90vh]">
                <header className="modal-header py-6 px-8 border-b border-[color:var(--color-border)]">
                    <h2 className="modal-title text-2xl font-semibold m-0 text-[color:var(--color-text)]">{props.card ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
                    <button className="modal-close bg-transparent border-none cursor-pointer text-[color:var(--color-text-muted)]" onClick={props.onCancel} title="Fermer">
                        <X size={24} weight="bold" />
                    </button>
                </header>
                <CardFormContent {...props} />
            </div>
        </div>
    );
};