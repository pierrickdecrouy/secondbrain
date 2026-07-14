import React, { useState, useEffect, useRef } from 'react';
import {
    X, UploadSimple, Warning, FileText, FileCode, Info,
    CheckCircle, CloudArrowUp, Table, Cards, ArrowRight
} from '@phosphor-icons/react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Card, CardType } from '../types';
import { validateImportData } from '../utils/importValidation';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useTheme } from '../context/ThemeContext';
import { parseJsonFormat, parseTextFormat, parseCsvFormat } from '../utils/importParser';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    existingCards?: Card[];
}

type ImportMode = 'json' | 'text' | 'csv';

const MODE_META: Record<ImportMode, { label: string; icon: React.ReactNode; color: string; accent: string }> = {
    text: {
        label: 'Texte / Markdown',
        icon: <FileText size={15} weight="bold" />,
        color: '#0d9488',
        accent: 'rgba(13,148,136,0.12)',
    },
    json: {
        label: 'JSON',
        icon: <FileCode size={15} weight="bold" />,
        color: '#8b5cf6',
        accent: 'rgba(139,92,246,0.12)',
    },
    csv: {
        label: 'CSV / Excel',
        icon: <Table size={15} weight="bold" />,
        color: '#f59e0b',
        accent: 'rgba(245,158,11,0.12)',
    },
};

const PLACEHOLDERS: Record<ImportMode, string> = {
    text: `# Nom du Cours
Matière: Cardiologie
[Urgence, Concept]
Cartes liées: id-de-carte-1, id-de-carte-2
Voici la description de mon cours sur l'IC.

## 1. Concept Clé
Ceci est une sous-partie (concept) liée au cours.

### Question de ma flashcard ?
Réponse de la flashcard (liée au concept).
`,
    json: `[\n  {\n    "title": "Aspirine",\n    "subtitle": "AINS",\n    "type": "drug",\n    "tags": ["Douleur", "Fièvre"]\n  }\n]`,
    csv: `Titre;Contenu;Tags;Matière\nAspirine;AINS;Douleur,Fièvre;Pharmaco\nParacétamol;Antalgique;Douleur;Pharmaco`,
};

export const BatchImportContent: React.FC<BatchImportModalProps> = ({
    onImport,
    onClose,
    existingCards = [],
}) => {
    const { getCategoryColor } = useTheme();
    const [step, setStep] = useState<'edit' | 'preview'>('edit');
    const [importMode, setImportMode] = useState<ImportMode>('text');
    const [input, setInput] = useState('');
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [parsedCards, setParsedCards] = useState<Card[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const [pendingImportCards, setPendingImportCards] = useState<Card[] | null>(null);
    const [duplicateSample, setDuplicateSample] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!input.trim()) {
            setParsedCards([]);
            setError(null);
            return;
        }

        const trimmed = input.trim();
        let currentMode = importMode;

        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            if (currentMode !== 'json') { setImportMode('json'); currentMode = 'json'; }
        } else if (
            (trimmed.includes(';') || trimmed.includes(',')) &&
            trimmed.split('\n')[0].split(/[;,]/).length > 1 &&
            !trimmed.startsWith('#')
        ) {
            if (currentMode !== 'csv') { setImportMode('csv'); currentMode = 'csv'; }
        }

        try {
            let processed: Card[] = [];
            if (currentMode === 'json') processed = parseJsonFormat(trimmed, 'misc' as CardType, groupName);
            else if (currentMode === 'csv') processed = parseCsvFormat(trimmed, 'misc' as CardType, groupName);
            else processed = parseTextFormat(input, 'misc' as CardType, groupName);
            setError(null);
            setParsedCards(processed);
        } catch (err) {
            setParsedCards([]);
            if (currentMode === 'json' && input.length > 5) {
                setError(`JSON Invalide: ${(err as Error).message}`);
            }
        }
    }, [input, importMode, groupName]);

    const handleFileLoad = (file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const content = ev.target.result as string;
                setInput(content);
                if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) setImportMode('csv');
                else if (file.name.endsWith('.json')) setImportMode('json');
                else setImportMode('text');
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        try {
            if (parsedCards.length === 0) throw new Error('Aucune fiche valide trouvée.');
            const validationResult = validateImportData(parsedCards);
            if (!validationResult.success) {
                const errorMsg = validationResult.errors.slice(0, 3).join('\n') +
                    (validationResult.errors.length > 3 ? `\n... (+${validationResult.errors.length - 3} autres)` : '');
                throw new Error(`Échec de validation:\n${errorMsg}`);
            }
            if (validationResult.warnings.length > 0) setError(`⚠️ ${validationResult.warnings.join(' | ')}`);

            const finalCards = validationResult.validCards;
            const duplicates = finalCards.filter(nc => existingCards.some(e => e.id === nc.id));
            if (duplicates.length > 0 && duplicates[0]) {
                setPendingImportCards(finalCards);
                setDuplicateSample(`${duplicates.length} fiche(s) existent déjà (ex: ${duplicates[0].title}).`);
                return;
            }
            onImport(finalCards);
            if (onClose) onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'import");
        }
    };

    const activeMeta = MODE_META[importMode];

    return (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-[color:var(--color-bg)]">
            {step === 'edit' && (
                <>
                    {/* Top toolbar */}
                    <div className="py-4 px-5 border-b border-[color:var(--color-border)] flex items-center gap-3 bg-[color:var(--color-surface)] shrink-0">
                        <div className="flex bg-[color:var(--color-bg)] rounded-[10px] p-[3px] border border-[color:var(--color-border)]">
                            {(Object.keys(MODE_META) as ImportMode[]).map((m) => {
                                const meta = MODE_META[m];
                                const isActive = importMode === m;
                                return (
                                    <button
                                        key={m}
                                        onClick={() => setImportMode(m)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] border-none cursor-pointer text-xs transition-all duration-150 ${isActive ? 'font-bold' : 'font-medium text-[color:var(--color-text-muted)] bg-transparent'}`}
                                        style={isActive ? { color: meta.color, background: meta.accent } : {}}
                                    >
                                        <span className={isActive ? "" : "text-[color:var(--color-text-muted)]"} style={isActive ? { color: meta.color } : {}}>{meta.icon}</span>
                                        {meta.label}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Groupe optionnel (ex: Cours 3)"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="py-1.5 px-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] text-[13px] outline-none flex-1 max-w-[200px]"
                        />

                        <div className="ml-auto flex gap-2">
                            <label className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] text-[13px] font-medium cursor-pointer">
                                <UploadSimple size={15} /> Importer un fichier
                                <input type="file" accept=".txt,.json,.csv,.tsv,.md" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileLoad(file); e.target.value = ''; }} />
                            </label>
                            <button onClick={() => setShowHelp(!showHelp)} className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-[color:var(--color-border)] text-[13px] font-medium cursor-pointer ${showHelp ? 'bg-indigo-500/10 text-indigo-500' : 'bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)]'}`}>
                                <Info size={15} /> Guide
                            </button>
                        </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 flex min-h-0">
                        <div className="flex-1 p-6 relative flex">
                            <div
                                className={`flex-1 relative rounded-xl border-2 transition-all duration-200 overflow-hidden shadow-sm ${isDragOver ? 'border-solid' : 'border-dashed'}`}
                                style={{ borderColor: isDragOver ? activeMeta.color : 'var(--color-border)', background: isDragOver ? activeMeta.accent : 'var(--color-surface)' }}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileLoad(file); }}
                            >
                                {!input && !isDragOver && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
                                        <CloudArrowUp size={50} className="text-[color:var(--color-border)] opacity-80" />
                                        <p className="m-0 text-[14px] text-[color:var(--color-text-muted)] text-center">
                                            Glissez-déposez un fichier ici ou cliquez pour coller<br />
                                            <span className="text-xs opacity-70">Supporte Markdown, JSON, CSV</span>
                                        </p>
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onClick={() => textareaRef.current?.focus()}
                                    placeholder={PLACEHOLDERS[importMode]}
                                    className={`absolute inset-0 w-full h-full resize-none border-none bg-transparent text-[color:var(--color-text)] text-[14px] leading-[1.7] p-6 outline-none ${importMode === 'json' ? 'font-mono' : 'font-sans'}`}
                                />
                            </div>
                        </div>

                        {showHelp && (
                            <div className="shrink-0 w-[350px] border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-6 px-5 overflow-y-auto">
                                <h3 className="m-0 mb-4 text-base font-bold text-[color:var(--color-text)]">Guide de Syntaxe</h3>
                                
                                {importMode === 'text' && (
                                    <div className="mb-6 p-3 bg-indigo-500/10 rounded-lg text-[13px] text-indigo-400 border border-indigo-500/20">
                                        <strong>Ajout en masse de Cours :</strong><br/>
                                        <ul className="mt-2 pl-4 mb-0 space-y-1">
                                            <li><b># Titre</b> crée un Cours.</li>
                                            <li><b>## Titre</b> crée un Concept rattaché au cours.</li>
                                            <li><b>### Titre</b> crée une Flashcard (liée au-dessus).</li>
                                            <li><b>[tag1, tag2]</b> ajoute des tags.</li>
                                            <li><b>Cartes liées: id1, id2</b> pour lier des fiches existantes.</li>
                                        </ul>
                                    </div>
                                )}

                                {(Object.keys(MODE_META) as ImportMode[]).map((m) => {
                                    const meta = MODE_META[m];
                                    return (
                                        <div key={m} className="mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span style={{ color: meta.color }}>{meta.icon}</span>
                                                <span className="text-sm font-semibold text-[color:var(--color-text)]">{meta.label}</span>
                                            </div>
                                            <pre className="m-0 py-3 px-3.5 rounded-[10px] bg-[color:var(--color-bg)] border border-[color:var(--color-border)] text-xs text-[color:var(--color-text-muted)] overflow-x-auto leading-[1.6] font-mono">
                                                {PLACEHOLDERS[m]}
                                            </pre>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="py-4 px-6 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] flex items-center justify-between">
                        <button onClick={onClose} className="py-2.5 px-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-text)] font-semibold cursor-pointer">
                            Annuler
                        </button>
                        <div className="flex items-center gap-4">
                            {error && <div className="text-red-500 text-[13px] flex items-center gap-1.5"><Warning size={16} /> {error}</div>}
                            <button
                                onClick={() => { if (parsedCards.length > 0 && !error) setStep('preview'); }}
                                disabled={parsedCards.length === 0 || !!error}
                                className={`py-2.5 px-6 rounded-lg border-none font-bold flex items-center gap-2 ${parsedCards.length > 0 && !error ? 'bg-[color:var(--color-text)] text-[color:var(--color-bg)] cursor-pointer' : 'bg-[color:var(--color-border)] text-[color:var(--color-text-muted)] cursor-not-allowed'}`}
                            >
                                Prévisualiser ({parsedCards.length} fiches) <ArrowRight size={16} weight="bold" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {step === 'preview' && (
                <>
                    <div className="py-4 px-6 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setStep('edit')} className="py-1.5 px-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-text)] font-medium cursor-pointer text-[13px]">
                                Retour
                            </button>
                            <h2 className="m-0 text-[1.1rem] font-bold text-[color:var(--color-text)]">Vérification de l'import</h2>
                        </div>
                        <div className="flex items-center gap-2 bg-teal-600/10 text-teal-600 py-1.5 px-3 rounded-full text-[13px] font-bold">
                            <Cards size={16} weight="bold" /> {parsedCards.length} élément(s) détecté(s)
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                        {parsedCards.map((card, idx) => {
                            const color = getCategoryColor(card.type);
                            const indent = card.nodeType === 'flashcard' ? 48 : card.nodeType === 'concept' ? 24 : 0;
                            return (
                                <div key={idx} className="p-4 rounded-[10px] bg-[color:var(--color-surface)] border border-[color:var(--color-border)] flex flex-col gap-2 relative" style={{ marginLeft: indent }}>
                                    {indent > 0 && (
                                        <div className="absolute -left-6 top-6 w-6 h-[2px] bg-[color:var(--color-border)]" />
                                    )}
                                    <div className="flex items-start justify-between gap-2">
                                        <span className={`text-[15px] text-[color:var(--color-text)] leading-[1.4] ${card.nodeType === 'course' ? 'font-extrabold' : 'font-semibold'}`}>
                                            {card.title}
                                        </span>
                                        <div className="flex gap-2">
                                            {card.nodeType && (
                                                <span className="text-[11px] font-bold py-0.5 px-2 rounded-md bg-[color:var(--color-bg)] text-[color:var(--color-text-muted)] border border-[color:var(--color-border)] uppercase">
                                                    {card.nodeType}
                                                </span>
                                            )}
                                            {card.type && (
                                                <span className="text-[11px] font-bold py-0.5 px-2 rounded-md uppercase border" style={{ background: `${color}1a`, color: color, borderColor: `${color}33` }}>
                                                    {card.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {card.tags && card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {card.tags.map((tag) => (
                                                <span key={tag} className="text-xs py-1 px-2 rounded-md bg-[color:var(--color-bg)] text-[color:var(--color-text-muted)] border border-[color:var(--color-border)]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="py-4 px-6 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] flex items-center justify-between">
                        <button onClick={onClose} className="py-2.5 px-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-text)] font-semibold cursor-pointer">
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            className="py-2.5 px-6 rounded-lg border-none text-white font-bold cursor-pointer flex items-center gap-2 shadow-[0_4px_14px_rgba(13,148,136,0.3)] bg-gradient-to-br from-teal-600 to-cyan-600"
                        >
                            <CheckCircle size={18} weight="bold" />
                            Valider et Importer
                        </button>
                    </div>
                </>
            )}

            {pendingImportCards && (
                <ConfirmDeleteModal
                    title="Conflits d'identifiants"
                    heading="Des fiches existent déjà"
                    message={<>{duplicateSample}<br />Voulez-vous les écraser avec les nouvelles données ?</>}
                    confirmLabel="Écraser"
                    cancelLabel="Annuler"
                    confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
                    onConfirm={() => { onImport(pendingImportCards); setPendingImportCards(null); setDuplicateSample(''); if (onClose) onClose(); }}
                    onCancel={() => { setPendingImportCards(null); setDuplicateSample(''); }}
                />
            )}
        </div>
    );
};

export const BatchImportModal: React.FC<BatchImportModalProps> = (props) => {
    const modalRef = useFocusTrap(true);
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
            <div className="relative w-full max-w-[1000px] shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200" ref={modalRef as any}>
                <button onClick={props.onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors z-10"><X size={20} /></button>
                <BatchImportContent {...props} />
            </div>
        </div>
    );
};
