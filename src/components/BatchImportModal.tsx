import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileText, FileJson } from 'lucide-react';
import type { Card, CardType } from '../types';
import { validateImportData } from '../utils/importValidation';
import { rebuildIndex } from '../searchIndex';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    existingCards?: Card[];
}

type ImportMode = 'json' | 'text';

export const BatchImportContent: React.FC<BatchImportModalProps> = ({ onImport, onClose, existingCards = [] }) => {
    const [importMode, setImportMode] = useState<ImportMode>('text');
    const [input, setInput] = useState('');
    const [cardType, setCardType] = useState<CardType>('drug');
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sanitize text (remove invisible characters like zero-width spaces)
    const sanitizeText = (text: string): string => {
        return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    };

    // Generate safe ID
    const generateSafeId = (title: string): string => {
        return sanitizeText(title).toLowerCase()
            .replace(/[^a-z0-9à-ÿ]+/gi, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Load file content into the text area
    const loadFileContent = useCallback((file: File) => {
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.json')) {
            setError('Format non supporté. Glissez un fichier .txt, .md ou .json');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setInput(content);
            setError(null);
            setImportSummary(null);
            // Auto-detect JSON
            const trimmed = content.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                setImportMode('json');
                try {
                    const parsed = JSON.parse(content);
                    setPreviewCount(Array.isArray(parsed) ? parsed.length : 1);
                } catch { /* ignore */ }
            } else {
                setImportMode('text');
                const count = (content.match(/^#[^#]/m) ? content.split(/^#(?!#)/m).filter(Boolean).length : 0);
                if (count > 0) setPreviewCount(count);
            }
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFileContent(file);
    }, [loadFileContent]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFileContent(file);
        // Reset so same file can be re-selected
        e.target.value = '';
    }, [loadFileContent]);

    // Parse text format
    const parseTextFormat = (text: string): Card[] => {
        const sections = text.split('#').filter(s => s.trim());
        const cards: Card[] = [];

        sections.forEach(section => {
            const lines = section.trim().split('\n');
            if (lines.length === 0) return;

            const rawTitle = lines[0].trim();
            if (!rawTitle) return;

            const title = sanitizeText(rawTitle);
            const extractedTags: string[] = [];
            const processedLines: string[] = [];

            lines.slice(1).forEach(line => {
                const tagMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
                if (tagMatch) {
                    const tags = tagMatch[1].split(',').map(t => sanitizeText(t.trim())).filter(Boolean);
                    extractedTags.push(...tags);
                } else if (line.trim()) {
                    processedLines.push(sanitizeText(line));
                }
            });

            // Clean invisible chars from content logic
            const subtitle = processedLines[0] || '';
            const contentLines = processedLines.slice(1);
            // Legacy mapping removed
            const details = contentLines.length > 0 ? contentLines.join('\n\n') : subtitle;

            cards.push({
                id: generateSafeId(title),
                type: cardType,
                title,
                subtitle,
                content: details, // Use full details as content
                details,
                tags: [
                    ...extractedTags,
                    ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
                ],
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

        // Auto-detect JSON
        const trimmed = value.trim();
        let currentMode = importMode;

        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            if (currentMode !== 'json') {
                setImportMode('json');
                currentMode = 'json';
            }
        }

        if (currentMode === 'json') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setPreviewCount(parsed.length);
                } else if (typeof parsed === 'object') {
                    setPreviewCount(1); // Single object
                } else {
                    setError("Le JSON doit être un tableau d'objets ou un objet unique.");
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
        try {
            let processedCards: Card[] = [];

            if (importMode === 'json') {
                const parsed = JSON.parse(input);
                let validCards: any[] = [];

                if (Array.isArray(parsed)) {
                    validCards = parsed.filter((c: any) => {
                        const title = c.title || c.Title || c.name || c.Name;
                        return !!title;
                    });
                } else if (typeof parsed === 'object' && parsed !== null) {
                    const title = parsed.title || parsed.Title || parsed.name || parsed.Name;
                    if (title) validCards = [parsed];
                } else {
                    throw new Error("Le format doit être un tableau JSON ou un objet unique.");
                }

                if (validCards.length === 0) {
                    throw new Error("Aucune fiche valide trouvée.");
                }

                processedCards = validCards.map((c: any) => {
                    const title = sanitizeText(c.title || c.Title || c.name || c.Name);
                    return {
                        ...c,
                        id: c.id ? sanitizeText(c.id) : generateSafeId(title),
                        title: title,
                        type: c.type || cardType,
                        tags: [
                            ...(c.tags || []),
                            ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
                        ],
                        subtitle: sanitizeText(c.subtitle || ''),
                        content: sanitizeText(c.content || ''),
                        details: sanitizeText(c.details || c.content || ''),
                    };
                });
            } else {
                processedCards = parseTextFormat(input);
                if (processedCards.length === 0) {
                    setError("Aucune fiche trouvée. Utilisez # pour séparer les fiches.");
                    return;
                }
            }

            // VALIDATION STEP (Zod) — partial mode: valid cards pass, invalid cards are reported
            const validationResult = validateImportData(processedCards);

            // Show warnings for skipped cards but continue with valid ones
            if (validationResult.skippedCount > 0) {
                const warnMsg = `${validationResult.skippedCount} fiche(s) invalide(s) ignorée(s) :\n` +
                    validationResult.errors.slice(0, 3).join('\n') +
                    (validationResult.errors.length > 3 ? `\n... (+${validationResult.errors.length - 3} autres)` : '');
                console.warn('Import validation warnings:', warnMsg);
            }

            if (validationResult.validCards.length === 0) {
                throw new Error('Aucune fiche valide après validation. Vérifiez le format.');
            }

            // Use the strictly valid cards
            processedCards = validationResult.validCards;

            // check duplicates
            const duplicates = processedCards.filter(newCard =>
                existingCards.some(existing => existing.id === newCard.id)
            );

            if (duplicates.length > 0) {
                const confirmOverwrite = window.confirm(
                    `${duplicates.length} fiches existent déjà (ex: ${duplicates[0].title}).\nVoulez-vous les mettre à jour (Écraser) ?\n\nAnnuler pour corriger.`
                );
                if (!confirmOverwrite) return;
            }

            // Trigger import
            onImport(processedCards);

            // Immediately rebuild search index with the new cards
            rebuildIndex([...existingCards, ...processedCards]);

            // Show import summary instead of closing immediately
            const skipped = validationResult.skippedCount;
            const total = processedCards.length;
            let summary = `✅ ${total} fiche${total !== 1 ? 's' : ''} importée${total !== 1 ? 's' : ''} et indexée${total !== 1 ? 's' : ''} immédiatement.`;
            if (skipped > 0) summary += ` (${skipped} ignorée${skipped !== 1 ? 's' : ''} — invalide${skipped !== 1 ? 's' : ''})`;
            setImportSummary(summary);

            // Close after a short delay
            setTimeout(() => onClose(), 2000);

        } catch (err: any) {
            setError(err.message || "Erreur lors de l'import");
        }
    };

    const types: { value: CardType; label: string }[] = [
        { value: 'drug', label: 'Médicament' },
        { value: 'patho', label: 'Pathologie' },
        { value: 'physio', label: 'Physiologie' },
        { value: 'data', label: 'Donnée' },
    ];

    return (
        <div className="batch-import-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <button
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        {showHelp ? 'Masquer l\'aide' : 'Guide & Exemples'}
                    </button>
                </div>

                {showHelp && (
                    <div style={{ marginBottom: '1rem', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.1rem' }}>Guide d'importation</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>
                                    Importez des fiches enrichies avec <strong>Markdown</strong>, <strong>Tableaux HTML</strong> et <strong>Icônes SVG</strong>.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <h4 style={{ color: '#334155', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} /> Format Texte (#)
                                </h4>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                                    <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', color: '#475569', fontSize: '0.85rem' }}>
                                        <li>Séparez les fiches avec <code># Titre de la fiche</code></li>
                                        <li>Ligne suivante : Sous-titre</li>
                                        <li>Tags entre crochets : <code>[Tag1, Tag2]</code></li>
                                        <li>Le reste est le contenu (Markdown + HTML supporté)</li>
                                    </ul>
                                    <pre style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'monospace', color: '#334155', whiteSpace: 'pre' }}>
                                        {`# Aspirine
Anti-inflammatoire non stéroïdien
[Douleur, Fièvre, AINS]

## Posologie
Adulte : 500mg à 1g toutes les 4h.

## Mécanisme
<div class="info-box">Inhibe irréversiblement les COX-1 et 2.</div>`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ color: '#334155', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileJson size={16} /> Format JSON
                                </h4>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                                    <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', color: '#475569', fontSize: '0.85rem' }}>
                                        <li>Un tableau d'objets : <code>[{`{ ... }`}, {`{ ... }`}]</code></li>
                                        <li>Champs requis : <code>title</code></li>
                                        <li>Champs optionnels : <code>subtitle</code>, <code>content</code> (HTML/MD), <code>tags</code> (array), <code>type</code></li>
                                    </ul>
                                    <pre style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'monospace', color: '#334155', whiteSpace: 'pre' }}>
                                        {`[
  {
    "title": "Paracétamol",
    "subtitle": "Antalgique antipyrétique",
    "type": "drug",
    "tags": ["Douleur", "Fièvre"],
    "content": "## Indications\\nDouleurs faibles à modérées.\\n\\n<table class='w-full'><tr><td>Dose max</td><td>4g/j</td></tr></table>"
  }
]`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Type par défaut</label>
                        <select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)}>
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Groupe (Cluster)</label>
                        <input
                            type="text"
                            placeholder="Ex: Antibiotiques, Cours N°1..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>
                            {importMode === 'text' ? 'Fiches séparées par #' : 'JSON Array'}
                        </label>
                        <button
                            type="button"
                            style={{
                                background: 'none',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '3px 10px',
                                fontSize: '0.78rem',
                                color: '#475569',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileText size={13} /> Ouvrir un fichier (.txt / .md / .json)
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.md,.json"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                    </div>
                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            border: isDragging ? '2px dashed #6366f1' : '2px dashed transparent',
                            borderRadius: '8px',
                            transition: 'border-color 0.2s',
                            background: isDragging ? '#f0f0ff' : 'transparent',
                        }}
                    >
                        {isDragging && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(99, 102, 241, 0.08)',
                                borderRadius: '8px',
                                zIndex: 10,
                                pointerEvents: 'none',
                                fontSize: '1rem',
                                color: '#6366f1',
                                fontWeight: 600,
                                gap: '10px',
                            }}>
                                <Upload size={20} /> Déposez le fichier ici
                            </div>
                        )}
                        <textarea
                            className={importMode === 'json' ? 'font-mono text-xs' : ''}
                            style={{ flex: 1, minHeight: '300px', resize: 'vertical' }}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={importMode === 'text'
                                ? 'Collez vos fiches ici ou glissez un fichier .txt/.md...'
                                : 'Collez votre JSON ici ou glissez un fichier .json...'}
                        />
                    </div>
                </div>

                {error && (
                    <div className="import-message error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {importSummary && (
                    <div className="import-message success">
                        <CheckCircle2 size={16} />
                        {importSummary}
                    </div>
                )}

                {previewCount !== null && !error && !importSummary && (
                    <div className="import-message success">
                        <CheckCircle2 size={16} />
                        {previewCount} fiches détectées
                    </div>
                )}
            </div>

            <div className="form-actions" style={{ paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff' }}>
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
    );
};

export const BatchImportModal: React.FC<BatchImportModalProps> = (props) => {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
            <div className="modal-content form-modal" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Import en masse</h2>
                    <button className="modal-close" onClick={props.onClose}>
                        <X size={20} />
                    </button>
                </div>
                <BatchImportContent {...props} />
            </div>
        </div>
    );
};
