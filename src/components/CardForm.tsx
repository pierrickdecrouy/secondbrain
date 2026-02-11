import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Save,
    Plus,
    Search,
    Link as LinkIcon,
    EyeOff,
    Upload,
    Info
} from 'lucide-react';
import type { Card, CardType } from '../types';
import { CARD_TYPES } from '../types';
import { useTheme } from '../context/ThemeContext';
import './CardForm.css';

interface CardFormProps {
    card?: Card | null; // Allow null for consistency with types
    existingCards: Card[]; // Renamed for consistency
    onSave: (card: Card) => void;
    onCancel: () => void;
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards, onSave, onCancel }) => {
    const { getCategoryColor } = useTheme();

    const [formData, setFormData] = useState<Partial<Card>>({
        type: 'drug',
        title: '',
        subtitle: '',
        content: '',
        tags: [],
        details: '', // Fixed: string instead of object
        manualConnections: [],
        suppressedConnections: [],
        imageUrl: ''
    });

    const [tagInput, setTagInput] = useState('');
    const [connectionSearch, setConnectionSearch] = useState('');
    const [suppressSearch, setSuppressSearch] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showMarkdownInfo, setShowMarkdownInfo] = useState(false);

    useEffect(() => {
        if (card) {
            setFormData({ ...card });
        }
    }, [card]);

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

    const handleSave = () => {
        if (!formData.title || !formData.type) return;

        const newCard: Card = {
            id: card?.id || Date.now().toString(),
            type: formData.type as CardType,
            title: formData.title,
            subtitle: formData.subtitle || '',
            content: formData.content || '',
            tags: formData.tags || [],
            details: formData.details || '',
            manualConnections: formData.manualConnections || [],
            suppressedConnections: formData.suppressedConnections || [],
            imageUrl: formData.imageUrl
        };

        onSave(newCard);
    };

    const addTag = () => {
        if (tagInput && !formData.tags?.includes(tagInput)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
            setTagInput('');
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

    return (
        <div className="card-form-body-content">
            <div className="card-form-body">
                {/* Column 1: Metadata (Left) */}
                <div className="form-column" style={{ maxWidth: '320px', background: '#f8fafc' }}>
                    <div className="form-group">
                        <label>Type de fiche</label>
                        <div className="type-selector">
                            {/* Merge defaults with existing custom types AND current selection */}
                            {Array.from(new Set([...CARD_TYPES, ...existingCards.map(c => c.type), formData.type]))
                                .filter(Boolean)
                                .sort()
                                .map((typeValue) => (
                                    <button
                                        key={typeValue}
                                        className={`type-btn ${formData.type === typeValue ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: typeValue })}
                                        style={formData.type === typeValue ? { backgroundColor: getCategoryColor(typeValue!), borderColor: getCategoryColor(typeValue!), color: 'white' } : {}}
                                    >
                                        {typeValue}
                                    </button>
                                ))}

                            {/* "Other" type creator */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="text"
                                    placeholder="Autre..."
                                    className="type-btn"
                                    style={{ width: '100px', cursor: 'text', padding: '0.4rem 0.8rem', background: 'white' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                setFormData({ ...formData, type: val });
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val) {
                                            setFormData({ ...formData, type: val });
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Titre</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nom du médicament, pathologie..."
                            className="form-input title-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Sous-titre / DCI</label>
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="Ex: Paracétamol"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tags</label>
                        <div className="tags-input-container">
                            {formData.tags?.map(tag => (
                                <span key={tag} className="tag-pill">
                                    {tag}
                                    <button onClick={() => removeTag(tag)}><X size={12} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTag()}
                                placeholder="Ajouter un tag..."
                                className="tag-input-field"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Résumé (Markdown)</label>
                        <textarea
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Bref résumé affiché dans la liste..."
                            className="form-textarea"
                            rows={6}
                        />
                    </div>
                </div>

                {/* Column 2: Main Content (Center) */}
                <div className="form-column main-content-column" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '5px', alignItems: 'center', background: '#fff' }}>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '**Gras**' }))} title="Gras"><b>B</b></button>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '*Italique*' }))} title="Italique"><i>I</i></button>
                        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 5px' }} />
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '\n# Titre 1\n' }))} title="Titre 1">H1</button>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '\n## Titre 2\n' }))} title="Titre 2">H2</button>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '\n- Liste\n' }))} title="Liste à puces">• List</button>
                        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 5px' }} />
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '[[Lien]]' }))} title="Lien interne"><LinkIcon size={14} /></button>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '$$x=y$$' }))} title="Équation (Math)">∑</button>
                        <button className="toolbar-btn" onClick={() => setFormData(p => ({ ...p, details: (p.details || '') + '||Cloze||' }))} title="Trou (Cloze)">[ ]</button>

                        <div style={{ flex: 1 }} />

                        <div className="markdown-info-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="toolbar-btn"
                                onClick={() => setShowMarkdownInfo(!showMarkdownInfo)}
                                title="Guide Markdown"
                                style={{ background: showMarkdownInfo ? '#e2e8f0' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Info size={18} color="#64748b" />
                            </button>

                            {showMarkdownInfo && (
                                <div className="markdown-guide-popover" style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    right: 0,
                                    width: '300px',
                                    background: 'white',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    padding: '1rem',
                                    zIndex: 50,
                                    marginBottom: '0.5rem',
                                    textAlign: 'left'
                                }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Raccourcis Markdown</h4>
                                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: '1.6' }}>
                                        <li><b>**Gras**</b> : Texte en gras</li>
                                        <li><i>*Italique*</i> : Texte en italique</li>
                                        <li># Titre 1 : Grand titre</li>
                                        <li>## Titre 2 : Sous-titre</li>
                                        <li>- Item : Liste à puces</li>
                                        <li>1. Item : Liste numérotée</li>
                                        <li>[[Titre Fiche]] : Lien interne</li>
                                        <li>$$x=y$$ : Équation Math (LaTeX)</li>
                                        <li>||Texte|| : Trou (masqué au début)</li>
                                        <li>&gt; Citation : Bloc de citation</li>
                                        <li>--- : Séparateur horizontal</li>
                                    </ul>
                                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowMarkdownInfo(false)}>
                                        Fermer
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <textarea
                        value={formData.details}
                        onChange={e => setFormData({ ...formData, details: e.target.value })}
                        placeholder="Contenu détaillé de la fiche (Markdown complet, équations, liens...)"
                        className="form-textarea"
                        style={{ flex: 1, resize: 'none', borderRadius: 0, border: 'none', padding: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}
                    />
                </div>

                {/* Column 3: Connections (Right) */}
                <div className="form-column secondary-column" style={{ width: '300px', flex: 'none' }}>
                    <div className="form-section">
                        <h3><LinkIcon size={16} /> Connexions Manuelles</h3>
                        <p className="section-desc">Forcez des liens vers d'autres fiches.</p>

                        <div className="connection-search">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={connectionSearch}
                                onChange={e => setConnectionSearch(e.target.value)}
                            />
                        </div>

                        {connectionCandidates.length > 0 && (
                            <div className="candidates-list">
                                {connectionCandidates.map(c => (
                                    <div key={c.id} className="candidate-item" onClick={() => toggleConnection(c.id)}>
                                        <span className="candidate-type" style={{ color: getCategoryColor(c.type) }}>●</span>
                                        {c.title}
                                        <Plus size={14} style={{ marginLeft: 'auto' }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="connected-list">
                            {formData.manualConnections?.map(id => {
                                const linkedCard = existingCards.find(c => c.id === id);
                                if (!linkedCard) return null;
                                return (
                                    <div key={id} className="connected-item">
                                        <LinkIcon size={12} style={{ color: getCategoryColor(linkedCard.type) }} />
                                        <span>{linkedCard.title}</span>
                                        <button onClick={() => toggleConnection(id)} className="remove-link-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {(!formData.manualConnections || formData.manualConnections.length === 0) && (
                                <div className="empty-state">Aucune connexion</div>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><EyeOff size={16} /> Exclusions</h3>
                        <div className="connection-search">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher à exclure..."
                                value={suppressSearch}
                                onChange={e => setSuppressSearch(e.target.value)}
                            />
                        </div>

                        {suppressionCandidates.length > 0 && (
                            <div className="candidates-list">
                                {suppressionCandidates.map(c => (
                                    <div key={c.id} className="candidate-item warning" onClick={() => toggleSuppression(c.id)}>
                                        <EyeOff size={14} />
                                        {c.title}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="connected-list">
                            {formData.suppressedConnections?.map(id => {
                                const linkedCard = existingCards.find(c => c.id === id);
                                if (!linkedCard) return null;
                                return (
                                    <div key={id} className="connected-item suppressed">
                                        <EyeOff size={12} />
                                        <span>{linkedCard.title}</span>
                                        <button onClick={() => toggleSuppression(id)} className="remove-link-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="form-section">
                        <h3 onClick={() => setShowAdvanced(!showAdvanced)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Avancé</span>
                            <span>{showAdvanced ? '-' : '+'}</span>
                        </h3>

                        {showAdvanced && (
                            <div className="form-group" style={{ marginTop: '10px' }}>
                                <label>URL Image</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={formData.imageUrl || ''}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="form-input"
                                        style={{ flex: 1 }}
                                    />
                                    <label className="browse-action-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                        <Upload size={16} />
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-form-footer">
                <button className="btn-cancel" onClick={onCancel}>Annuler</button>
                <button className="btn-save" onClick={handleSave} disabled={!formData.title}>
                    <Save size={18} /> Enregistrer
                </button>
            </div>
        </div>
    );
};

// Wrapper for standalone modal usage
export const CardForm: React.FC<CardFormProps> = (props) => {
    return (
        <div className="card-form-overlay">
            <div className="card-form">
                <div className="card-form-header">
                    <h2>{props.card ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
                    <button className="close-btn" onClick={props.onCancel}><X size={24} /></button>
                </div>
                <CardFormContent {...props} />
            </div>
        </div>
    );
};
