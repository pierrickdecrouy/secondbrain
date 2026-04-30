import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Save,
    Plus,
    Search,
    EyeOff,
    Upload,
    Info,
    Link2,
} from 'lucide-react';
import type { Card, CardType } from '../types';
import { CARD_TYPES } from '../types';
import { useTheme } from '../context/ThemeContext';
import { suggestAbbreviationLinks } from '../utils/abbreviationLinks';
import './CardForm.css';

interface CardFormProps {
    card?: Card | null;
    existingCards: Card[];
    onSave: (card: Card) => void;
    onCancel: () => void;
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards, onSave, onCancel }) => {
    const { getCategoryColor } = useTheme();

    // Form State
    const [formData, setFormData] = useState<Partial<Card>>({
        type: 'drug',
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

    // Only trigger when content settles. Title/Type changes don't trigger re-gen to avoid spam.

    useEffect(() => {
        if (card) {
            setFormData({ ...card });
            if (!CARD_TYPES.includes(card.type as any)) {
                setIsCustomTypeActive(true);
                setCustomTypeInput(card.type);
            }
        }
    }, [card]);

    // ... (rest of derived lists)

    // Abbreviation link suggestions
    const abbrevSuggestions = useMemo(() => {
        const draftCard: Card = {
            id: card?.id ?? '_draft',
            type: (formData.type as CardType) || 'data',
            title: formData.title || '',
            subtitle: formData.subtitle || '',
            content: formData.content || '',
            details: formData.details || '',
            tags: formData.tags || [],
        };
        if (!draftCard.title && !draftCard.content && !draftCard.details) return [];
        return suggestAbbreviationLinks(draftCard, existingCards, 5);
    }, [formData.title, formData.content, formData.details, existingCards, card?.id]);

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
    const handleSave = () => {
        if (!formData.title || !formData.type) return;

        const now = Date.now();
        const newCard: Card = {
            id: card?.id || now.toString(),
            type: formData.type as CardType,
            title: formData.title,
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
    };

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
            alert('L\'upload nécessite l\'application Electron');
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

                {/* 1. Identity Box */}
                <div className="form-box app-style">
                    <div className="box-header app-header-style">
                        <h3>Identité & Catégorie</h3>
                    </div>
                    <div className="box-content app-content-style">
                        <div className="input-group">
                            <label className="field-label">Titre</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Titre de la fiche..."
                                className="app-input title-input"
                            />
                        </div>

                        <div className="input-group">
                            <label className="field-label">Catégorie</label>

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
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="field-label">Sous-titre / DCI</label>
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
                        <div className="header-actions">
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
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="box-content no-padding">

                        <textarea
                            value={formData.details}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                            placeholder="Rédigez le contenu..."
                            className="boxed-textarea app-textarea"
                            rows={15}
                        />
                    </div>
                </div>

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
                                    <Plus size={14} className="tag-icon" />
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
                            <label className="field-label">Lier à d'autres fiches</label>
                            <div className="search-row app-input-row">
                                <Search size={14} className="search-icon-input" />
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
                                        <div key={c.id} className="candidate-row" onClick={() => toggleConnection(c.id)}>
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
                            <label className="field-label warning">Exclusions (Masquer liens)</label>
                            <div className="search-row app-input-row warning">
                                <EyeOff size={14} className="search-icon-input warning-icon" />
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
                                        <div key={c.id} className="candidate-row warning" onClick={() => toggleSuppression(c.id)}>
                                            <EyeOff size={14} /> <span>{c.title}</span>
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
                            <label className="field-label">Image Principale</label>
                            <div className="input-with-action app-input-row">
                                <input
                                    type="text"
                                    value={formData.imageUrl || ''}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="app-input flex-1 border-0"
                                    placeholder="URL ou Upload..."
                                />
                                <label className="action-btn-secondary">
                                    <Upload size={14} />
                                    <input type="file" hidden onChange={handleImageUpload} />
                                </label>
                            </div>
                            {formData.imageUrl && (
                                <div className="image-preview app-preview">
                                    <img src={formData.imageUrl} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}
                        </div>

                        <div className="input-group mt-4">
                            <label className="field-label">Résumé Court</label>
                            <textarea
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
                <button className="btn-cancel app-btn-secondary" onClick={onCancel}>Annuler</button>
                <button className="btn-save app-btn-primary" onClick={handleSave} disabled={!formData.title}>
                    <Save size={16} /> Enregistrer
                </button>
            </div>
        </div>
    );
};

export const CardForm: React.FC<CardFormProps> = (props) => {
    return (
        <div className="card-form-overlay">
            <div className="card-form app-card-form">
                <div className="card-form-header app-header">
                    <h2>{props.card ? 'Modifier Fiche' : 'Nouvelle Fiche'}</h2>
                    <button className="close-btn app-close-btn" onClick={props.onCancel}><X size={20} /></button>
                </div>
                <CardFormContent {...props} />
            </div>
        </div>
    );
};
