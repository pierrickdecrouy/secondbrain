import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Card } from '../types';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ onImport, onClose }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setJsonInput(value);
        setError(null);
        setPreviewCount(null);

        if (!value.trim()) return;

        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                setPreviewCount(parsed.length);
            } else {
                setError("Le JSON doit être un tableau d'objets (Array)");
            }
        } catch (err) {
            // Don't show syntax error immediately while typing, only if they pause or submit?
            // Actually simple validation on change is fine for preview count if valid
        }
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                throw new Error("Le format doit être un tableau JSON [ ... ]");
            }

            // Basic validation of required fields
            const validCards = parsed.filter((c: any) => c.title && c.type);

            if (validCards.length === 0) {
                throw new Error("Aucune fiche valide trouvée. Vérifiez que 'title' et 'type' sont présents.");
            }

            // Add IDs if missing
            const processedCards: Card[] = validCards.map((c: any) => ({
                ...c,
                id: c.id || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                tags: c.tags || [],
                subtitle: c.subtitle || '',
                content: c.content || '',
                details: c.details || `<p>${c.content || ''}</p>`,
            }));

            onImport(processedCards);
            onClose();
        } catch (err: any) {
            setError(err.message || "Erreur de parsing JSON");
        }
    };

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
                    <p className="text-sm text-gray-500 mb-4">
                        Collez ici votre liste de fiches au format JSON.
                    </p>

                    <div className="form-group">
                        <textarea
                            className="font-mono text-xs"
                            rows={15}
                            value={jsonInput}
                            onChange={handleJsonChange}
                            placeholder='[
  {
    "title": "Aspirine",
    "type": "drug",
    "content": "Anti-inflammatoire non stéroïdien...",
    "tags": ["Douleur", "Fièvre"]
  },
  ...
]'
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {previewCount !== null && !error && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg mb-4 text-sm">
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
                            disabled={!jsonInput.trim() || !!error}
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
