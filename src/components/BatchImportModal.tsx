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
    // Enhanced parsing: first line = title, second = subtitle, rest = content
    // Tags can be added with [tag1, tag2] on any line
    const parseTextFormat = (text: string): Card[] => {
        const sections = text.split('#').filter(s => s.trim());
        const cards: Card[] = [];

        sections.forEach(section => {
            const lines = section.trim().split('\n');
            if (lines.length === 0) return;

            const title = lines[0].trim();
            if (!title) return;

            // Check for tags in square brackets [tag1, tag2]
            const extractedTags: string[] = [];
            const processedLines: string[] = [];

            lines.slice(1).forEach(line => {
                const tagMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
                if (tagMatch) {
                    const tags = tagMatch[1].split(',').map(t => t.trim()).filter(Boolean);
                    extractedTags.push(...tags);
                } else if (line.trim()) {
                    processedLines.push(line.trim());
                }
            });

            // First non-empty line after title = subtitle
            const subtitle = processedLines[0] || '';

            // Rest = content and details
            const contentLines = processedLines.slice(1);
            const content = subtitle; // Short summary for grid view

            // Build rich details in Markdown format
            let details = '';
            if (contentLines.length > 0) {
                details = contentLines.join('\n\n');
            } else {
                details = subtitle;
            }

            cards.push({
                id: title.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, '-').replace(/-+$/, ''),
                type: cardType,
                title,
                subtitle,
                content,
                details,
                tags: extractedTags,
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

                const validCards = parsed.filter((c: any) => {
                    // Flexible title check
                    const title = c.title || c.Title || c.name || c.Name;
                    return !!title; // Type is optional now, falls back to selected
                });

                if (validCards.length === 0) {
                    throw new Error("Aucune fiche valide trouvée. Vérifiez que 'title' (ou 'name') est présent.");
                }

                const processedCards: Card[] = validCards.map((c: any) => {
                    const title = c.title || c.Title || c.name || c.Name;
                    return {
                        ...c,
                        id: c.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        title: title,
                        type: c.type || cardType, // Use selected type as fallback
                        tags: c.tags || [],
                        subtitle: c.subtitle || '',
                        content: c.content || '',
                        details: c.details || c.content || '',
                    };
                });

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

                    <div className="form-group">
                        <label>Type par défaut (si non spécifié dans le JSON)</label>
                        <select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)}>
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

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
Antalgique et anti-inflammatoire.
Inhibe les COX-1 et COX-2.
[Douleur, Fièvre, AINS]

# Paracétamol
Analgésique central
Antalgique de palier 1.
Mécanisme d'action central mal connu.
[Douleur, Fièvre]

# Ibuprofène
AINS
Anti-inflammatoire non stéroïdien.
Dérivé de l'acide propionique.
[Inflammation, Douleur]`
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
