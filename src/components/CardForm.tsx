import React, { useState, useMemo } from 'react';

import { Save, X, Upload, Link as LinkIcon, Search, ShieldBan } from 'lucide-react';
import { generateId } from '../types';
import type { Card, CardType } from '../types';

interface CardFormProps {
    card?: Card | null;
    existingCards?: Card[]; // For manual connections
    onSave: (card: Card) => void;
    onCancel: () => void;
}

export const CardFormContent: React.FC<CardFormProps> = ({ card, existingCards = [], onSave, onCancel }) => {
    const [title, setTitle] = useState(card?.title || '');
    const [subtitle, setSubtitle] = useState(card?.subtitle || '');
    const [type, setType] = useState<CardType>(card?.type || 'drug');
    const [content, setContent] = useState(card?.content || '');
    const [details, setDetails] = useState(card?.details || '');
    const [tagsInput, setTagsInput] = useState(card?.tags.join(', ') || '');
    const [imageUrl, setImageUrl] = useState(card?.imageUrl || '');

    // Manual Connections State
    const [manualConnections, setManualConnections] = useState<string[]>(card?.manualConnections || []);
    const [connectionSearch, setConnectionSearch] = useState('');

    const [suppressedConnections, setSuppressedConnections] = useState<string[]>(card?.suppressedConnections || []);
    const [suppressionSearch, setSuppressionSearch] = useState('');

    const filteredCards = useMemo(() => {
        if (!existingCards || !connectionSearch.trim()) return [];
        const query = connectionSearch.toLowerCase();
        return existingCards
            .filter(c => c.id !== card?.id && !manualConnections.includes(c.id))
            .filter(c => c.title.toLowerCase().includes(query))
            .slice(0, 5);
    }, [existingCards, connectionSearch, card, manualConnections]);

    const handleAddConnection = (targetId: string) => {
        setManualConnections(prev => [...prev, targetId]);
        setConnectionSearch('');
    };

    const handleRemoveConnection = (targetId: string) => {
        setManualConnections(prev => prev.filter(id => id !== targetId));
    };

    const filteredSuppressionCards = useMemo(() => {
        if (!existingCards || !suppressionSearch.trim()) return [];
        const query = suppressionSearch.toLowerCase();
        return existingCards
            .filter(c => c.id !== card?.id && !suppressedConnections.includes(c.id))
            .filter(c => c.title.toLowerCase().includes(query))
            .slice(0, 5);
    }, [existingCards, suppressionSearch, card, suppressedConnections]);

    const handleAddSuppression = (targetId: string) => {
        setSuppressedConnections(prev => [...prev, targetId]);
        setSuppressionSearch('');
    };

    const handleRemoveSuppression = (targetId: string) => {
        setSuppressedConnections(prev => prev.filter(id => id !== targetId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCard: Card = {
            id: card?.id || generateId(title),
            type,
            title,
            subtitle,
            content,
            details: details || content, // Use content as fallback
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            ...(imageUrl && { imageUrl }),
            manualConnections,
            suppressedConnections,
        };

        onSave(newCard);
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file && window.electronAPI) {
                    try {
                        const buffer = await file.arrayBuffer();
                        const savedPath = await window.electronAPI.saveImage({
                            buffer,
                            name: `paste-${Date.now()}.png`,
                            type: file.type
                        });
                        setImageUrl(savedPath);
                    } catch (err) {
                        console.error('Paste image failed', err);
                    }
                }
                break;
            }
        }
    };

    const types: { value: CardType; label: string }[] = [
        { value: 'drug', label: 'Médicament' },
        { value: 'patho', label: 'Pathologie' },
        { value: 'physio', label: 'Physiologie' },
        { value: 'data', label: 'Donnée' },
    ];

    return (
        <form onSubmit={handleSubmit} onPaste={handlePaste} className="card-form">
            <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Insuline"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="subtitle">Sous-titre</label>
                <input
                    id="subtitle"
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Hormone hypoglycémiante"
                />
            </div>

            <div className="form-group">
                <label htmlFor="type">Type *</label>
                <div style={{ position: 'relative' }}>
                    <input
                        list="types-list"
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="Sélectionner ou saisir un type..."
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.375rem'
                        }}
                    />
                    <datalist id="types-list">
                        {types.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </datalist>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="content">Résumé *</label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Description courte pour la vue grille..."
                    rows={2}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="details">Contenu détaillé (Markdown supporté)</label>
                <textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="# Titre&#10;&#10;- Liste item&#10;- **Gras** et *italique*&#10;&#10;> Citation"
                    rows={6}
                />
            </div>

            <div className="form-group">
                <label htmlFor="tags">Tags (séparés par des virgules)</label>
                <input
                    id="tags"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Ex: Diabète, Pancréas, Endocrino"
                />
            </div>

            <div className="form-group">
                <label htmlFor="imageUrl">Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        id="imageUrl"
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... ou safe-file://..."
                        style={{ flex: 1 }}
                    />
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Upload size={16} />
                        Upload
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && window.electronAPI) {
                                    try {
                                        const buffer = await file.arrayBuffer();
                                        const savedPath = await window.electronAPI.saveImage({
                                            buffer,
                                            name: file.name,
                                            type: file.type
                                        });
                                        setImageUrl(savedPath);
                                    } catch (err) {
                                        console.error('Upload failed', err);
                                    }
                                } else if (file) {
                                    alert('L\'upload nécessite l\'application Electron');
                                }
                            }}
                        />
                    </label>
                </div>
                {imageUrl && (
                    <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} />
                    </div>
                )}
            </div>

            {/* Manual Connections Section */}
            <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={16} />
                    Connexions Manuelles (God Mode)
                </label>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                    Forcez des liens directs vers d'autres fiches. Ces liens seront toujours visibles et prioritaires.
                </p>

                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Rechercher une fiche à lier..."
                        value={connectionSearch}
                        onChange={(e) => setConnectionSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                    {/* Autocomplete Dropdown */}
                    {filteredCards.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0 0 8px 8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {filteredCards.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => handleAddConnection(c.id)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    className="hover:bg-slate-50"
                                >
                                    <span style={{ fontWeight: 500 }}>{c.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                        {c.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Connections Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {manualConnections.map(targetId => {
                        const targetCard = existingCards?.find(c => c.id === targetId);
                        if (!targetCard) return null;
                        return (
                            <div key={targetId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#FFF7ED', // Orange-50
                                border: '1px solid #FDBA74', // Orange-300
                                color: '#C2410C', // Orange-700
                                padding: '4px 8px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}>
                                <LinkIcon size={12} />
                                {targetCard.title}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveConnection(targetId)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#C2410C'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Suppressed Connections Section */}
            <div className="form-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                    <ShieldBan size={16} />
                    Connexions Bloquées (Blacklist)
                </label>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                    Empêchez l'IA de créer des liens vers ces fiches.
                </p>

                {/* Search Input for Suppression */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Rechercher une fiche à bloquer..."
                        value={suppressionSearch}
                        onChange={(e) => setSuppressionSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                    {/* Autocomplete Dropdown */}
                    {filteredSuppressionCards.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0 0 8px 8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {filteredSuppressionCards.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => handleAddSuppression(c.id)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    className="hover:bg-slate-50"
                                >
                                    <span style={{ fontWeight: 500 }}>{c.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                        {c.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Suppression Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suppressedConnections.map(targetId => {
                        const targetCard = existingCards?.find(c => c.id === targetId);
                        if (!targetCard) return null;
                        return (
                            <div key={targetId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#FEF2F2', // Red-50
                                border: '1px solid #FCA5A5', // Red-300
                                color: '#B91C1C', // Red-700
                                padding: '4px 8px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}>
                                <ShieldBan size={12} />
                                {targetCard.title}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSuppression(targetId)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#B91C1C'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>



            <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Annuler
                </button>
                <button type="submit" className="btn-primary">
                    <Save size={16} />
                    Enregistrer
                </button>
            </div>
        </form>
    );
};

export const CardForm: React.FC<CardFormProps> = (props) => {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && props.onCancel()}>
            <div className="modal-content form-modal">
                <div className="modal-header">
                    <h2 className="modal-title">{props.card ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
                    <button className="modal-close" onClick={props.onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <CardFormContent {...props} />
            </div>
        </div>
    );
};
