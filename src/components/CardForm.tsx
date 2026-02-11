import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Save,
    Plus,
    Search,
    Link as LinkIcon,
    EyeOff,
    Upload
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
                {/* Colonne Gauche: Infos principales */}
                <div className="form-column">
                    <div className="form-group">
                        <label>Type de fiche</label>
                        <div className="type-selector">
                            {Object.entries(CARD_TYPES).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`type-btn ${formData.type === key ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, type: key as CardType })}
                                    style={formData.type === key ? { backgroundColor: getCategoryColor(key), borderColor: getCategoryColor(key), color: 'white' } : {}}
                                >
                                    {label}
                                </button>
                            ))}
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
                        <label>Contenu (Markdown supporté)</label>
                        <textarea
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Description détaillée, posologie, mécanisme..."
                            className="form-textarea"
                            rows={12}
                        />
                        <div className="markdown-hint">
                            **Gras**, *Italique*, - Liste, # Titre, [[LienInterne]]
                        </div>
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
                </div>

                {/* Colonne Droite: Méta & Connexions */}
                <div className="form-column secondary-column">
                    <div className="form-section">
                        <h3><LinkIcon size={16} /> Connexions Manuelles</h3>
                        <p className="section-desc">Forcez des liens vers d'autres fiches.</p>

                        <div className="connection-search">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher une fiche à lier..."
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
                                <div className="empty-state">Aucune connexion manuelle</div>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><EyeOff size={16} /> Connexions Supprimées</h3>
                        <p className="section-desc">Empêchez l'IA de lier ces fiches.</p>

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
