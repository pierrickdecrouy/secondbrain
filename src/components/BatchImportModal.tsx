import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileText, FileJson } from 'lucide-react';
import type { Card, CardType } from '../types';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
}

type ImportMode = 'json' | 'text';

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ onImport, onClose }) => {
    const [importMode, setImportMode] = useState<ImportMode>('text');
    const [input, setInput] = useState('');
    const [cardType, setCardType] = useState<CardType>('drug');
    const [error, setError] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    // Parse text format: cards separated by #
    const parseTextFormat = (text: string): Card[] => {
        const sections = text.split('#').filter(s => s.trim());
        const cards: Card[] = [];

        sections.forEach(section => {
            const lines = section.trim().split('\n').filter(l => l.trim());
            if (lines.length === 0) return;

            const title = lines[0].trim();
            const subtitle = lines[1]?.trim() || '';
            const content = lines.slice(2).join('\n').trim();

            cards.push({
                id: title.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, '-').replace(/-+$/, ''),
                type: cardType,
                title,
                subtitle,
                content,
                details: content,
                tags: [],
            });
        });

        return cards;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        setError(null);
        setPreviewCount(null);

        if (!value.trim()) return;

        if (importMode === 'json') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setPreviewCount(parsed.length);
                } else {
                    setError("Le JSON doit être un tableau d'objets (Array)");
                }
            } catch {
                // Don't show error while typing
            }
        } else {
            const cards = parseTextFormat(value);
            if (cards.length > 0) {
                setPreviewCount(cards.length);
            }
        }
    };

    const handleImport = () => {
        if (importMode === 'json') {
            try {
                const parsed = JSON.parse(input);
                if (!Array.isArray(parsed)) {
                    throw new Error("Le format doit être un tableau JSON [ ... ]");
                }

                const validCards = parsed.filter((c: any) => c.title && c.type);

                if (validCards.length === 0) {
                    throw new Error("Aucune fiche valide trouvée. Vérifiez que 'title' et 'type' sont présents.");
                }

                const processedCards: Card[] = validCards.map((c: any) => ({
                    ...c,
                    id: c.id || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    tags: c.tags || [],
                    subtitle: c.subtitle || '',
                    content: c.content || '',
                    details: c.details || c.content || '',
                }));

                onImport(processedCards);
                onClose();
            } catch (err: any) {
                setError(err.message || "Erreur de parsing JSON");
            }
        } else {
            const cards = parseTextFormat(input);
            if (cards.length === 0) {
                setError("Aucune fiche trouvée. Utilisez # pour séparer les fiches.");
                return;
            }
            onImport(cards);
            onClose();
        }
    };

    const types: { value: CardType; label: string }[] = [
        { value: 'drug', label: 'Médicament' },
        { value: 'patho', label: 'Pathologie' },
        { value: 'physio', label: 'Physiologie' },
        { value: 'data', label: 'Donnée' },
    ];

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content form-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Import en masse</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="import-mode-tabs">
                        <button
                            className={`import-tab ${importMode === 'text' ? 'active' : ''}`}
                            onClick={() => { setImportMode('text'); setInput(''); setError(null); setPreviewCount(null); }}
                        >
                            <FileText size={16} />
                            Texte simple
                        </button>
                        <button
                            className={`import-tab ${importMode === 'json' ? 'active' : ''}`}
                            onClick={() => { setImportMode('json'); setInput(''); setError(null); setPreviewCount(null); }}
                        >
                            <FileJson size={16} />
                            JSON
                        </button>
                    </div>

                    {importMode === 'text' && (
                        <div className="form-group">
                            <label>Type des fiches</label>
                            <select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)}>
                                {types.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            {importMode === 'text'
                                ? 'Fiches séparées par #'
                                : 'JSON Array'
                            }
                        </label>
                        <textarea
                            className={importMode === 'json' ? 'font-mono text-xs' : ''}
                            rows={12}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={importMode === 'text'
                                ? `# Aspirine
Acide acétylsalicylique
Antalgique et anti-inflammatoire. Inhibe les COX.

# Paracétamol
Analgésique central
Antalgique de palier 1. Mécanisme d'action mal connu.

# Ibuprofène
AINS
Anti-inflammatoire non stéroïdien.`
                                : `[
  {
    "title": "Aspirine",
    "type": "drug",
    "content": "Anti-inflammatoire non stéroïdien...",
    "tags": ["Douleur", "Fièvre"]
  }
]`
                            }
                        />
                    </div>

                    {error && (
                        <div className="import-message error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {previewCount !== null && !error && (
                        <div className="import-message success">
                            <CheckCircle2 size={16} />
                            {previewCount} fiches détectées
                        </div>
                    )}

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleImport}
                            disabled={!input.trim() || !!error}
                        >
                            <Upload size={18} />
                            Importer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
