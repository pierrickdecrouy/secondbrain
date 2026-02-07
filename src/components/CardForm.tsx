import { useState } from 'react';
import { X, Save, Upload } from 'lucide-react';
import type { Card, CardType } from '../types';
import { generateId } from '../storage';

interface CardFormProps {
    card?: Card | null;
    onSave: (card: Card) => void;
    onCancel: () => void;
}

export const CardForm: React.FC<CardFormProps> = ({ card, onSave, onCancel }) => {
    const [title, setTitle] = useState(card?.title || '');
    const [subtitle, setSubtitle] = useState(card?.subtitle || '');
    const [type, setType] = useState<CardType>(card?.type || 'drug');
    const [content, setContent] = useState(card?.content || '');
    const [details, setDetails] = useState(card?.details || '');
    const [tagsInput, setTagsInput] = useState(card?.tags.join(', ') || '');
    const [imageUrl, setImageUrl] = useState(card?.imageUrl || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCard: Card = {
            id: card?.id || generateId(title),
            type,
            title,
            subtitle,
            content,
            details: details || content, // Use content as fallback, no HTML wrapper needed for Markdown
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            ...(imageUrl && { imageUrl }), // Only include if not empty
        };

        onSave(newCard);
    };

    const types: { value: CardType; label: string }[] = [
        { value: 'drug', label: 'Médicament' },
        { value: 'patho', label: 'Pathologie' },
        { value: 'physio', label: 'Physiologie' },
        { value: 'data', label: 'Donnée' },
    ];

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal-content form-modal">
                <div className="modal-header">
                    <h2 className="modal-title">{card ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="card-form">
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
                                                alert('Échec de l\'upload de l\'image');
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

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-primary">
                            <Save size={18} />
                            {card ? 'Enregistrer' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
