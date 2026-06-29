// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    X,
    FloppyDisk,
    Plus,
    MagnifyingGlass,
    EyeSlash,
    UploadSimple,
    Info,
    Highlighter
} from '@phosphor-icons/react';
import type { Card, CardType } from '../types';
import { CARD_TYPES } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CourseEditor } from './CourseEditor';
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
    const { showToast } = useToast();

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
    const [tagInput, setTagInput] = useState('');
    const [connectionSearch, setConnectionSearch] = useState('');
    const [suppressSearch, setSuppressSearch] = useState('');
    const [showMarkdownInfo, setShowMarkdownInfo] = useState(false);



    // Category Management
    const [customTypeInput, setCustomTypeInput] = useState('');
    const [isCustomTypeActive, setIsCustomTypeActive] = useState(false);

    // Tag Management
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        existingCards.forEach(c => c.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [existingCards]);

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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({ ...card });
            if (!CARD_TYPES.includes(card.type as any)) {
                setIsCustomTypeActive(true);
                setCustomTypeInput(card.type);
            }
        }
    }, [card]);

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
            id: card?.id || now.toString(),
            type: formData.type as CardType,
            nodeType: formData.nodeType || 'concept',
            format: formData.format || 'q&a',
            parentId: formData.parentId,
            title: finalTitle,
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

    const addTag = (tagToAdd: string) => {
        if (tagToAdd && !formData.tags?.includes(tagToAdd)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagToAdd] }));
            setTagInput('');
        }
    };

    const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__new__') {
            // Focus plain input
            // Handled by UI state mostly
        } else if (val) {
            addTag(val);
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
                const savedPath = await window.electronAPI.saveImage({
                    buffer,
                    name: file.name,
                    type: file.type
                });
                setFormData(prev => ({ ...prev, imageUrl: savedPath }));
            } catch (err) {
                console.error('Upload failed', err);
            }
        } else if (file) {
            showToast('L\'upload nécessite l\'application Electron', 'error');
        }
    };

    const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomTypeInput(val);
        setFormData({ ...formData, type: val });
    };

    return (
        <div className="card-form-container">

            <div className="card-form-scroll-area vertical-stack">

                {formData.nodeType === 'flashcard' ? (
                    <>
                        <div className="form-box app-style">
                            <div className="box-header app-header-style">
                                <h3>Type de Flashcard</h3>
                            </div>
                            <div className="box-content app-content-style">
                                <select
                                    className="app-select full-width"
                                    value={formData.format || 'q&a'}
                                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                                >
                                    <option value="q&a">Question / Réponse</option>
                                    <option value="cloze">Texte à trous</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-box app-style">
                            <div className="box-header app-header-style">
                                <h3>Contenu</h3>
                            </div>
                            <div className="box-content app-content-style">
                                {formData.format === 'cloze' ? (
                                    <div className="input-group">
                                        <div className="field-label">Texte avec trous (utilisez les accolades {'{mot}'})</div>
                                        <textarea
                                            value={formData.content || ''}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            className="app-input"
                                            rows={4}
                                            placeholder="Exemple: L'enzyme {Troponine} s'élève lors d'un IDM."
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="input-group">
                                            <div className="field-label">Question (Recto)</div>
                                            <textarea
                                                value={formData.title || ''}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="app-input"
                                                rows={2}
                                                placeholder="Quelle est la question ?"
                                            />
                                        </div>
                                        <div className="input-group mt-4" style={{ marginTop: 16 }}>
                                            <div className="field-label">Réponse (Verso)</div>
                                            <textarea
                                                value={formData.details || ''}
                                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                                className="app-input"
                                                rows={4}
                                                placeholder="Quelle est la réponse ?"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 1. Identity Box */}
                        <div className="form-box app-style">
                            <div className="box-header app-header-style">
                                <h3>Identité & Catégorie</h3>
                            </div>
                            <div className="box-content app-content-style">
                                <div className="input-group">
                                    <div className="field-label">Titre</div>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Titre de la fiche..."
                                        className="app-input title-input"
                                    />
                                </div>

                                <div className="input-group">
                                    <div className="field-label">Catégorie</div>

                                    <div className="category-wrapper">
                                        <select
                                            className="app-select full-width"
                                            value={isCustomTypeActive ? '__custom__' : formData.type}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '__custom__') {
                                                    setIsCustomTypeActive(true);
                                                    setFormData({ ...formData, type: customTypeInput || '' });
                                                } else {
                                                    setIsCustomTypeActive(false);
                                                    setFormData({ ...formData, type: val });
                                                }
                                            }}
                                        >
                                            {CARD_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                            <option value="__custom__">Autre / Nouveau...</option>
                                        </select>

                                        {isCustomTypeActive && (
                                            <input
                                                type="text"
                                                className="app-input mt-2"
                                                value={customTypeInput}
                                                onChange={handleCustomTypeChange}
                                                placeholder="Nom de la catégorie..."
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="field-label">Sous-titre / DCI</div>
                                    <input
                                        type="text"
                                        value={formData.subtitle}
                                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                        placeholder="Optionnel..."
                                        className="app-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Content Box */}
                        <div className="form-box app-style">
                            <div className="box-header app-header-style flex-between">
                                <h3>Contenu</h3>
                                <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className={`icon-btn ${showMarkdownInfo ? 'active' : ''}`}
                                        onClick={() => setShowMarkdownInfo(!showMarkdownInfo)}
                                        title="Aide Markdown"
                                    >
                                        <Info size={16} />
                                    </button>
                                    {showMarkdownInfo && (
                                        <div className="markdown-tooltip-popover app-popover">
                                            <h4>Guide Markdown</h4>
                                            <div className="md-guide-grid">
                                                <div className="md-col">
                                                    <h5>Style</h5>
                                                    <ul>
                                                        <li><b>**Gras**</b></li>
                                                        <li><i>*Italique*</i></li>
                                                        <li>~Barré~</li>
                                                        <li>{'`Code`'}</li>
                                                    </ul>
                                                </div>
                                                <div className="md-col">
                                                    <h5>Structure</h5>
                                                    <ul>
                                                        <li># H1 Heading</li>
                                                        <li>## H2 Heading</li>
                                                        <li>- Liste</li>
                                                        <li>1. Liste num.</li>
                                                    </ul>
                                                </div>
                                                <div className="md-col">
                                                    <h5>Avancé</h5>
                                                    <ul>
                                                        <li>[[Lien]]</li>
                                                        <li>||Caché||</li>
                                                        <li>$$Math$$</li>
                                                        <li>![Alt](url)</li>
                                                        <li>==Surligné==</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="box-content no-padding">

                                <CourseEditor
                                    value={formData.details || ''}
                                    onChange={(val) => setFormData({ ...formData, details: val })}
                                    existingCards={existingCards}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* 3. Tags Box */}
                <div className="form-box app-style">
                    <div className="box-header app-header-style">
                        <h3>Mots-clés / Tags</h3>
                    </div>
                    <div className="box-content app-content-style">
                        <div className="tags-wrapper">
                            {formData.tags?.map(tag => (
                                <span key={tag} className="tag-chip app-chip">
                                    #{tag}
                                    <X size={12} onClick={() => removeTag(tag)} className="tag-remove-btn" />
                                </span>
                            ))}



                            <div className="tag-selector-group">
                                <select
                                    className="app-select"
                                    onChange={handleTagSelect}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Ajouter un tag...</option>
                                    {uniqueTags.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                    <option value="__new__">Créer nouveau...</option>
                                </select>

                                {/* Always show input if user wants to type or if 'Create new' selected (logic simplified: always allow typing if preferred) */}
                                <div className="tag-input-box app-input-box">
                                    <Plus size={14} className="tag-icon" style={{ cursor: 'pointer' }} onClick={() => addTag(tagInput)} />
                                    <input
                                        type="text"
                                        placeholder="Nouveau..."
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addTag(tagInput)}
                                        className="tag-input-clean"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Connections Box */}
                <div className="form-box app-style">
                    <div className="box-header app-header-style">
                        <h3>Connexions</h3>
                    </div>
                    <div className="box-content app-content-style vertical-connections">
                        {/* Manual Links */}
                        <div className="connection-block">
                            <div className="field-label">Lier à d'autres fiches</div>
                            <div className="search-row app-input-row">
                                <MagnifyingGlass size={14} className="search-icon-input" />
                                <input
                                    type="text"
                                    placeholder="Rechercher une fiche..."
                                    value={connectionSearch}
                                    onChange={e => setConnectionSearch(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            {connectionCandidates.length > 0 && (
                                <div className="candidates-dropdown app-dropdown">
                                    {connectionCandidates.map(c => (
                                        <div key={c.id} className="candidate-row" onClick={() => toggleConnection(c.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleConnection(c.id); }}>
                                            <div className="dot" style={{ background: getCategoryColor(c.type) }} />
                                            <span>{c.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="linked-list">
                                {formData.manualConnections?.map(id => {
                                    const linked = existingCards.find(c => c.id === id);
                                    return linked ? (
                                        <div key={id} className="linked-chip app-chip">
                                            <span>{linked.title}</span>
                                            <X size={12} onClick={() => toggleConnection(id)} className="remove-link" />
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>

                        {/* Exclusions */}
                        <div className="connection-block mt-4">
                            <div className="field-label warning">Exclusions (Masquer liens)</div>
                            <div className="search-row app-input-row warning">
                                <EyeSlash size={14} className="search-icon-input warning-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher fiche à exclure..."
                                    value={suppressSearch}
                                    onChange={e => setSuppressSearch(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            {suppressionCandidates.length > 0 && (
                                <div className="candidates-dropdown app-dropdown">
                                    {suppressionCandidates.map(c => (
                                        <div key={c.id} className="candidate-row warning" onClick={() => toggleSuppression(c.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSuppression(c.id); }}>
                                            <EyeSlash size={14} /> <span>{c.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="linked-list">
                                {formData.suppressedConnections?.map(id => {
                                    const linked = existingCards.find(c => c.id === id);
                                    return linked ? (
                                        <div key={id} className="linked-chip warning app-chip">
                                            <span>{linked.title}</span>
                                            <X size={12} onClick={() => toggleSuppression(id)} className="remove-link" />
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Media Box */}
                <div className="form-box app-style">
                    <div className="box-header app-header-style">
                        <h3>Média & Résumé</h3>
                    </div>
                    <div className="box-content app-content-style">
                        <div className="input-group">
                            <div className="field-label">Image Principale</div>
                            <div className="input-with-action app-input-row">
                                <input
                                    type="text"
                                    value={formData.imageUrl || ''}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="app-input flex-1 border-0"
                                    placeholder="URL ou Upload..."
                                />
                                <label htmlFor="image-upload" className="action-btn-secondary">
                                    <UploadSimple size={14} />
                                    <input id="image-upload" type="file" hidden onChange={handleImageUpload} />
                                </label>
                            </div>
                            {formData.imageUrl && (
                                <div className="image-preview app-preview">
                                    <img src={formData.imageUrl} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}
                        </div>

                        <div className="input-group mt-4">
                            <div className="field-label">Résumé Court</div>
                            <textarea
                                id="md-textarea"
                                rows={2}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="app-textarea-small"
                                placeholder="Bref résumé pour la liste..."
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="card-form-footer-fixed app-footer">
                <button className="btn-cancel app-btn-secondary" onClick={() => {
                    if (formData.title || formData.content || formData.details) {
                        onPause?.(formData);
                    } else {
                        isExplicitlyClosedRef.current = true;
                        onCancel();
                    }
                }} title="Ferme la fenêtre et met la tâche en pause">
                    Fermer
                </button>
                <button className="btn-save app-btn-primary" onClick={handleSave} disabled={!formData.title}>
                    <FloppyDisk size={16} /> Enregistrer
                </button>
            </div>
        </div>
    );
};

export const CardForm: React.FC<CardFormProps> = (props) => {
    return (
        <div className="card-form-overlay">
            <div className="card-form app-card-form">
                <CardFormContent {...props} />
            </div>
        </div>
    );
};
