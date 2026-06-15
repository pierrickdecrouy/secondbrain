import React, { useState, useEffect } from 'react';
import { X, UploadSimple, Warning, FileText, FileCode, Info } from '@phosphor-icons/react';
import type { Card, CardType } from '../types';
import { validateImportData } from '../utils/importValidation';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useTheme } from '../context/ThemeContext';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    existingCards?: Card[];
}

type ImportMode = 'json' | 'text';
type ImportCandidate = Partial<Card> & Record<string, unknown>;

const pickString = (...values: unknown[]): string => {
    const first = values.find((v): v is string => typeof v === 'string' && v.trim().length > 0);
    return first ? first : '';
};

export const BatchImportContent: React.FC<BatchImportModalProps> = ({ onImport, onClose, existingCards = [] }) => {
    const { getCategoryColor } = useTheme();
    const [importMode, setImportMode] = useState<ImportMode>('text');
    const [input, setInput] = useState('');
    const [cardType, setCardType] = useState<CardType>('drug');
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [parsedCards, setParsedCards] = useState<Card[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const [pendingImportCards, setPendingImportCards] = useState<Card[] | null>(null);
    const [duplicateSample, setDuplicateSample] = useState<string>('');

    const sanitizeText = (text: string): string => text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    
    const generateSafeId = (title: string): string => {
        return sanitizeText(title).toLowerCase()
            .replace(/[^a-z0-9à-ÿ]+/gi, '-')
            .replace(/^-+|-+$/g, '');
    };

    const parseTextFormat = (text: string): Card[] => {
        const cards: Card[] = [];
        const lines = text.split('\n');
        
        const rawSections: string[][] = [];
        let currentSection: string[] = [];

        lines.forEach(line => {
            if (line.trim().startsWith('#') && !line.trim().startsWith('##')) {
                if (currentSection.length > 0) {
                    rawSections.push(currentSection);
                }
                // Start a new section, strip the leading '#'
                currentSection = [line.replace(/^\s*#\s*/, '')];
            } else {
                if (currentSection.length > 0) {
                    currentSection.push(line);
                }
            }
        });
        if (currentSection.length > 0) {
            rawSections.push(currentSection);
        }

        rawSections.forEach(sectionLines => {
            if (sectionLines.length === 0) return;

            const rawTitle = sectionLines[0].trim();
            if (!rawTitle) return;

            const title = sanitizeText(rawTitle);
            const extractedTags: string[] = [];
            let subject = '';
            
            let subtitle = '';
            const contentLines: string[] = [];
            
            let parsingMetadata = true;
            let subtitleFound = false;

            sectionLines.slice(1).forEach(line => {
                const trimmed = line.trim();
                
                if (parsingMetadata) {
                    const tagMatch = trimmed.match(/^\[([^\]]+)\]$/);
                    const subjectMatch = trimmed.match(/^(?:Subject|Matière|Matiere|Module)\s*:\s*(.+)$/i);
                    
                    if (tagMatch) {
                        const tags = tagMatch[1].split(',').map(t => sanitizeText(t.trim())).filter(Boolean);
                        extractedTags.push(...tags);
                        return; // Skip this line
                    } else if (subjectMatch) {
                        subject = sanitizeText(subjectMatch[1]);
                        return; // Skip this line
                    } else if (trimmed === '') {
                        return; // Skip empty lines in metadata section
                    } else if (!subtitleFound && !trimmed.startsWith('##')) {
                        // First non-metadata, non-empty line is the subtitle, IF it's not a markdown heading
                        subtitle = sanitizeText(trimmed);
                        subtitleFound = true;
                        return; // Skip this line
                    } else {
                        // We found something else (like a heading), metadata section is over
                        parsingMetadata = false;
                    }
                }
                
                // Content
                contentLines.push(line);
            });

            const details = contentLines.join('\n').trim();

            cards.push({
                id: generateSafeId(title),
                type: cardType,
                title,
                subtitle,
                content: details || subtitle, // fallback if empty
                details: details || subtitle,
                tags: [
                    ...extractedTags,
                    ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
                ],
                subject: subject || undefined,
            });
        });

        return cards;
    };

    useEffect(() => {
        if (!input.trim()) {
            setParsedCards([]);
            setError(null);
            return;
        }

        const trimmed = input.trim();
        let currentMode = importMode;

        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            if (currentMode !== 'json') {
                setImportMode('json');
                currentMode = 'json';
            }
        }

        try {
            let processed: Card[] = [];
            if (currentMode === 'json') {
                const parsed = JSON.parse(trimmed);
                let validCards: ImportCandidate[] = [];

                if (Array.isArray(parsed)) {
                    validCards = parsed.filter((c: ImportCandidate) => !!pickString(c.title, c.Title, c.name, c.Name));
                } else if (typeof parsed === 'object' && parsed !== null) {
                    const parsedCandidate = parsed as ImportCandidate;
                    if (pickString(parsedCandidate.title, parsedCandidate.Title, parsedCandidate.name, parsedCandidate.Name)) {
                        validCards = [parsed];
                    }
                } else {
                    throw new Error("Le JSON doit être un tableau d'objets ou un objet unique.");
                }

                processed = validCards.map((c) => {
                    const title = sanitizeText(pickString(c.title, c.Title, c.name, c.Name));
                    return {
                        ...c,
                        id: pickString(c.id) ? sanitizeText(pickString(c.id)) : generateSafeId(title),
                        title: title,
                        type: (pickString(c.type) as CardType) || cardType,
                        tags: [
                            ...(Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === 'string') : []),
                            ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
                        ],
                        subtitle: sanitizeText(pickString(c.subtitle)),
                        content: sanitizeText(pickString(c.content)),
                        details: sanitizeText(pickString(c.details, c.content)),
                        subject: pickString(c.subject, c.Subject, c.matiere, c.Matiere, c.module, c.Module) ? sanitizeText(pickString(c.subject, c.Subject, c.matiere, c.Matiere, c.module, c.Module)) : undefined,
                    } as Card;
                });
            } else {
                processed = parseTextFormat(input);
            }
            
            setError(null);
            setParsedCards(processed);
        } catch (err) {
            setParsedCards([]);
            if (currentMode === 'json' && input.length > 5) {
                setError(`JSON Invalide: ${(err as Error).message}`);
            }
        }
    }, [input, importMode, cardType, groupName]);


    const handleImport = () => {
        try {
            if (parsedCards.length === 0) {
                throw new Error("Aucune fiche valide trouvée.");
            }

            const validationResult = validateImportData(parsedCards);

            if (!validationResult.success) {
                const errorMsg = validationResult.errors.slice(0, 3).join('\n') +
                    (validationResult.errors.length > 3 ? `\n... (+${validationResult.errors.length - 3} autres)` : '');
                throw new Error(`Échec de validation:\n${errorMsg}`);
            }

            if (validationResult.warnings.length > 0) {
                setError(`⚠️ ${validationResult.warnings.join(' | ')}`);
            }

            const finalCards = validationResult.validCards;
            const duplicates = finalCards.filter(newCard =>
                existingCards.some(existing => existing.id === newCard.id)
            );

            if (duplicates.length > 0 && duplicates[0]) {
                setPendingImportCards(finalCards);
                setDuplicateSample(`${duplicates.length} fiche(s) existent déjà (ex: ${duplicates[0].title}).`);
                return;
            }

            onImport(finalCards);
            if (onClose) onClose();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erreur lors de l'import";
            setError(message);
        }
    };

    const types: { value: CardType; label: string }[] = [
        { value: 'drug', label: 'Médicament' },
        { value: 'patho', label: 'Pathologie' },
        { value: 'physio', label: 'Physiologie' },
        { value: 'data', label: 'Donnée' },
    ];

    return (
        <div className="batch-import-container" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', height: '600px', width: '100%', background: 'var(--color-bg)' }}>
            {/* Left Pane: Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', padding: '1.5rem', background: 'var(--color-bg)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="import-mode-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: importMode === 'text' ? 'var(--color-bg)' : 'transparent', color: importMode === 'text' ? 'var(--color-text)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: importMode === 'text' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => { setImportMode('text'); }}
                        >
                            <FileText size={16} />
                            Texte
                        </button>
                        <button
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: importMode === 'json' ? 'var(--color-bg)' : 'transparent', color: importMode === 'json' ? 'var(--color-text)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: importMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                            onClick={() => { setImportMode('json'); }}
                        >
                            <FileCode size={16} />
                            JSON
                        </button>
                    </div>

                    <button
                        style={{ background: 'transparent', border: 'none', color: showHelp ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        <Info size={18} />
                        Guide
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Type par défaut</label>
                        <select 
                            value={cardType} 
                            onChange={(e) => setCardType(e.target.value as CardType)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
                        >
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Groupe (Optionnel)</label>
                        <input
                            type="text"
                            placeholder="Ex: Cardiologie, Cours N°1..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
                        />
                    </div>
                </div>

                <textarea
                    style={{ 
                        flex: 1, 
                        resize: 'none', 
                        background: 'var(--color-surface)', 
                        color: 'var(--color-text)', 
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '1rem',
                        fontFamily: importMode === 'json' ? 'monospace' : 'inherit',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        outline: 'none'
                    }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={importMode === 'text' ? '# Titre de la fiche\nSous-titre\n[Tag1, Tag2]\n\nContenu détaillé ici...' : '[\n  {\n    "title": "Nom de la fiche",\n    "tags": ["tag1"]\n  }\n]'}
                />

                {error && (
                    <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <Warning size={16} weight="bold" />
                        {error}
                    </div>
                )}
            </div>

            {/* Right Pane: Preview / Help */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'hidden' }}>
                {showHelp ? (
                    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--color-text)' }}>Guide d'importation</h3>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FileText size={16} /> Format Texte (#)
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Utilisez le croisillon # pour délimiter vos fiches.</p>
                            <pre style={{ background: 'var(--color-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>
{`# Aspirine
Anti-inflammatoire non stéroïdien
[Douleur, Fièvre, AINS]
Matière: Pharmacologie

## Mécanisme
Inhibe irréversiblement les COX.`}
                            </pre>
                        </div>

                        <div>
                            <h4 style={{ color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FileCode size={16} /> Format JSON
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Importez un tableau d'objets JSON valides.</p>
                            <pre style={{ background: 'var(--color-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>
{`[
  {
    "title": "Aspirine",
    "subtitle": "AINS",
    "type": "drug",
    "tags": ["Douleur", "Fièvre"]
  }
]`}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)' }}>Prévisualisation</h3>
                            <span style={{ background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {parsedCards.length}
                            </span>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {parsedCards.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                                    Saisissez vos données à gauche pour voir l'aperçu.
                                </div>
                            ) : (
                                parsedCards.map((card, idx) => (
                                    <div key={idx} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '10px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.2 }}>{card.title}</strong>
                                            {card.type && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                                    {card.type}
                                                </span>
                                            )}
                                        </div>
                                        {card.tags && card.tags.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {card.tags.map(tag => (
                                                    <span key={tag} style={{ fontSize: '0.7rem', color: getCategoryColor('default'), background: `${getCategoryColor('default')}20`, padding: '2px 6px', borderRadius: '4px' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: '1rem', background: 'var(--color-bg)' }}>
                            <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                                Annuler
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleImport}
                                disabled={parsedCards.length === 0 || !!error}
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                            >
                                <UploadSimple size={16} />
                                Importer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {pendingImportCards && (
                <ConfirmDeleteModal
                    title="Conflits d'identifiants"
                    heading="Des fiches existent déjà"
                    message={
                        <>
                            {duplicateSample}<br />
                            Voulez-vous les écraser avec les nouvelles données ?
                        </>
                    }
                    confirmLabel="Écraser"
                    cancelLabel="Annuler"
                    confirmClassName="btn-primary"
                    onConfirm={() => {
                        onImport(pendingImportCards);
                        setPendingImportCards(null);
                        setDuplicateSample('');
                        if (onClose) onClose();
                    }}
                    onCancel={() => {
                        setPendingImportCards(null);
                        setDuplicateSample('');
                    }}
                />
            )}
        </div>
    );
};

export const BatchImportModal: React.FC<BatchImportModalProps> = (props) => {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && props.onClose()} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '90%', maxWidth: '1000px', background: 'var(--color-bg)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <button 
                    onClick={props.onClose}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', zIndex: 10, padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={20} />
                </button>
                <BatchImportContent {...props} />
            </div>
        </div>
    );
};
