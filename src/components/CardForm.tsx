import { useState } from 'react';
import { X, Save } from 'lucide-react';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCard: Card = {
            id: card?.id || generateId(title),
            type,
            title,
            subtitle,
            content,
            details: details || `<p>${content}</p>`,
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
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
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as CardType)}
                        >
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
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
                        <label htmlFor="details">Contenu détaillé (HTML supporté)</label>
                        <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="<p>Contenu riche avec <strong>gras</strong>, listes, etc.</p>"
                            rows={5}
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
