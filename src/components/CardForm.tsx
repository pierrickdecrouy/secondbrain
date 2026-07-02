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
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards, onSave, onCancel, onPause }) => {
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
        return Array.from(cats).sort();
    }, [existingCards, card]);

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

    return (
    <>
        <div
            className="custom-scrollbar"
            style={{
                flex: 1, overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                minHeight: 0,
            }}
        >
            {formData.nodeType === 'flashcard' ? (
                <FlashcardEditor formData={formData} setFormData={setFormData} />
            ) : (
                <>
                    {/* Header: Title, Category, Tags */}
                    <div style={{ padding: '24px 36px 0', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Titre de la fiche..."
                                style={{ 
                                    flex: 1, 
                                    fontSize: '2rem', 
                                    fontWeight: 800, 
                                    border: 'none', 
                                    background: 'transparent', 
                                    color: 'var(--color-text)', 
                                    outline: 'none',
                                    padding: 0,
                                    margin: 0,
                                    lineHeight: 1.2
                                }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-border)', flexShrink: 0 }}>
                                <select
                                    value={isCustomTypeActive ? '__custom__' : (formData.type || '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '__custom__') {
                                            setIsCustomTypeActive(true);
                                            setFormData({ ...formData, type: customTypeInput || '' });
                                        } else {
                                            // U-3 fix: reset custom input when switching back to standard
                                            setIsCustomTypeActive(false);
                                            setCustomTypeInput('');
                                            setFormData({ ...formData, type: val });
                                        }
                                    }}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
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
                                        style={{ border: 'none', background: 'var(--color-bg)', padding: '4px 8px', borderRadius: 12, fontSize: '0.85rem', outline: 'none', width: 120 }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Subtitle & Tags */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                placeholder="Sous-titre ou description courte (optionnel)..."
                                style={{ flex: 1, minWidth: 200, padding: '0', fontSize: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', outline: 'none', fontWeight: 500 }}
                            />
                        </div>
                        <TagInput
                            tags={formData.tags || []}
                            uniqueTags={uniqueTags}
                            onAddTag={addTag}
                            onRemoveTag={removeTag}
                        />
                    </div>

                    {/* Editor (flex:1) */}
                    <div style={{ flex: 1, minHeight: 280, margin: '16px 32px 0', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contenu</span>
                            <button onClick={() => setShowMarkdownInfo(!showMarkdownInfo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 500 }}>
                                <Info size={13} /> Markdown
                            </button>
                        </div>
                        {showMarkdownInfo && (
                            <div style={{ padding: '8px 14px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                **Gras**, *Italique*, # Titre, - Liste, [[Lien]], $Math$
                            </div>
                        )}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <CourseEditor
                                value={formData.details || ''}
                                onChange={(val) => setFormData({ ...formData, details: val })}
                                existingCards={existingCards}
                            />
                        </div>
                    </div>

                    {/* Advanced toggle */}
                    <div style={{ padding: '12px 32px 20px', flexShrink: 0 }}>
                        <button
                            onClick={() => setShowAdvanced(v => !v)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0, marginBottom: showAdvanced ? 14 : 0 }}
                        >
                            <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', fontSize: '0.65rem' }}>▶</span>
                            Connexions & Image
                        </button>
                        {showAdvanced && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Lier à d'autres fiches</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem', background: 'var(--color-surface)', marginBottom: 8, gap: 8 }}>
                                            <MagnifyingGlass size={14} style={{ color: 'var(--color-text-muted)' }} />
                                            <input type="text" placeholder="Rechercher..." value={connectionSearch} onChange={e => setConnectionSearch(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: 0, fontSize: '0.88rem' }} />
                                        </div>
                                        {connectionCandidates.length > 0 && (
                                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                                                {connectionCandidates.map(c => (
                                                    <div key={c.id} onClick={() => toggleConnection(c.id)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getCategoryColor(c.type), flexShrink: 0 }} />{c.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {formData.manualConnections?.map(id => { const l = existingCards.find(c => c.id === id); return l ? <div key={id} style={{ fontSize: '0.8rem', padding: '3px 9px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>{l.title}<X size={10} onClick={() => toggleConnection(id)} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} /></div> : null; })}
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Masquer des connexions</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem', background: 'var(--color-surface)', marginBottom: 8, gap: 8 }}>
                                            <EyeSlash size={14} style={{ color: 'var(--color-text-muted)' }} />
                                            <input type="text" placeholder="Fiche à exclure..." value={suppressSearch} onChange={e => setSuppressSearch(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: 0, fontSize: '0.88rem' }} />
                                        </div>
                                        {suppressionCandidates.length > 0 && (
                                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                                                {suppressionCandidates.map(c => (
                                                    <div key={c.id} onClick={() => toggleSuppression(c.id)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>
                                                        <EyeSlash size={12} />{c.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {formData.suppressedConnections?.map(id => { const l = existingCards.find(c => c.id === id); return l ? <div key={id} style={{ fontSize: '0.8rem', padding: '3px 9px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>{l.title}<X size={10} onClick={() => toggleSuppression(id)} style={{ cursor: 'pointer' }} /></div> : null; })}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Image & Résumé court</label>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem', background: 'var(--color-surface)', gap: 8 }}>
                                                <input type="text" value={formData.imageUrl || ''} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: 0, fontSize: '0.88rem' }} placeholder="URL de l'image..." />
                                                <label htmlFor="image-upload" style={{ cursor: 'pointer', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: 8 }}><UploadSimple size={17} /><input id="image-upload" type="file" hidden onChange={handleImageUpload} /></label>
                                            </div>
                                            <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={2} placeholder="Bref résumé affiché dans la liste..." style={{ minHeight: 50 }} />
                                        </div>
                                        {formData.imageUrl && <div style={{ width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}><img src={formData.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display='none'} /></div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 32px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                    style={{ padding: '9px 22px', borderRadius: 8, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.88rem' }}
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
                        style={{ padding: '9px 14px', borderRadius: 8, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowHistory(true)}
                        title="Voir l'historique des modifications"
                    >
                        <ClockCounterClockwise size={16} />
                        Historique
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>⌘S</span>
                <button
                    style={{ padding: '9px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: ((formData.title || formData.format === 'cloze') && formData.type) ? 'pointer' : 'not-allowed', background: ((formData.title || formData.format === 'cloze') && formData.type) ? 'var(--color-primary)' : 'var(--color-surface)', color: ((formData.title || formData.format === 'cloze') && formData.type) ? '#fff' : 'var(--color-text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: 7, opacity: ((formData.title || formData.format === 'cloze') && formData.type) ? 1 : 0.5, transition: 'all 0.15s' }}
                    onClick={handleSave}
                    disabled={(!formData.title && formData.format !== 'cloze') || !formData.type}
                >
                    <FloppyDisk size={16} /> Enregistrer
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
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', padding: 0, maxWidth: '900px', height: '90vh' }}>
                <header className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 className="modal-title" style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>{props.card ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
                    <button className="modal-close" onClick={props.onCancel} title="Fermer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={24} weight="bold" />
                    </button>
                </header>
                <CardFormContent {...props} />
            </div>
        </div>
    );
};