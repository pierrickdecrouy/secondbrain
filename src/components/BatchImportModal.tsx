import React, { useState, useEffect, useRef } from 'react';
import {
    X, UploadSimple, Warning, FileText, FileCode, Info,
    CheckCircle, CloudArrowUp, Table, Cards
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
        icon: <FileText size={18} weight="bold" />,
        color: '#10B981',
        accent: 'rgba(16, 185, 129, 0.12)', // emerald
    },
    json: {
        label: 'JSON',
        icon: <FileCode size={18} weight="bold" />,
        color: '#8B5CF6',
        accent: 'rgba(139, 92, 246, 0.12)', // violet
    },
    csv: {
        label: 'CSV / Excel',
        icon: <Table size={18} weight="bold" />,
        color: '#F59E0B',
        accent: 'rgba(245, 158, 11, 0.12)', // amber
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
    json: `[
  {
    "title": "Aspirine",
    "subtitle": "AINS",
    "type": "drug",
    "tags": ["Douleur", "Fièvre"]
  }
]`,
    csv: `Titre;Contenu;Tags;Matière
Aspirine;AINS;Douleur,Fièvre;Pharmaco
Paracétamol;Antalgique;Douleur;Pharmaco`,
};

export const BatchImportContent: React.FC<BatchImportModalProps> = ({
    onImport,
    onClose,
    existingCards = [],
}) => {
    const { getCategoryColor } = useTheme();
    const [importMode, setImportMode] = useState<ImportMode>('text');
    const [input, setInput] = useState('');
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [parsedCards, setParsedCards] = useState<Card[]>([]);
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'import");
        }
    };

    const activeMeta = MODE_META[importMode];

    return (
        <div className="flex flex-col lg:flex-row flex-1 h-full p-6 sm:p-8 gap-8 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* LEFT PANE: Editor */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Header / Format selector */}
                <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0">Saisie des Données</h3>
                    
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        {(Object.keys(MODE_META) as ImportMode[]).map((m) => {
                            const meta = MODE_META[m];
                            const isActive = importMode === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => setImportMode(m)}
                                    className={`flex items-center gap-2 py-1.5 px-4 text-sm font-semibold rounded-lg transition-all border-none outline-none cursor-pointer ${isActive ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    <span style={{ color: isActive ? meta.color : 'inherit' }}>{meta.icon}</span>
                                    {meta.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tools & Group */}
                <div className="flex items-center gap-4 shrink-0">
                    <input
                        type="text"
                        placeholder="Groupe optionnel (ex: Cours 3)"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="flex-1 max-w-sm py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                    />
                    <label className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold cursor-pointer transition-colors shadow-sm">
                        <UploadSimple size={18} weight="bold" /> Parcourir...
                        <input type="file" accept=".txt,.json,.csv,.tsv,.md" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileLoad(file); e.target.value = ''; }} />
                    </label>
                </div>

                {/* Editor textarea */}
                <div 
                    className={`flex-1 relative rounded-2xl border-2 transition-all overflow-hidden shadow-inner ${isDragOver ? 'border-solid' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                    style={{ 
                        ...(isDragOver ? { borderColor: activeMeta.color, backgroundColor: activeMeta.accent } : {})
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileLoad(file); }}
                >
                    {!input && !isDragOver && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none opacity-50">
                            <CloudArrowUp size={64} className="text-slate-500 dark:text-slate-400" />
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400 text-center m-0">
                                Glissez-déposez un fichier ou collez votre texte ici<br />
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">Supporte Markdown, JSON, CSV</span>
                            </p>
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={PLACEHOLDERS[importMode]}
                        className={`absolute inset-0 w-full h-full resize-none border-none bg-transparent text-slate-900 dark:text-slate-100 text-base leading-relaxed p-6 outline-none focus:ring-0 custom-scrollbar ${importMode === 'json' ? 'font-mono' : 'font-sans'}`}
                    />
                </div>
            </div>

            {/* RIGHT PANE: Preview */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0">Aperçu</h3>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1.5 px-4 rounded-xl text-sm font-bold shadow-sm">
                        <Cards size={18} weight="bold" /> {parsedCards.length} élément(s)
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4 shadow-inner relative">
                    {parsedCards.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 text-slate-500 dark:text-slate-400">
                            <Info size={48} weight="duotone" className="mb-4" />
                            <p className="text-lg font-medium m-0">Aperçu du contenu importé</p>
                        </div>
                    ) : (
                        parsedCards.map((card, idx) => {
                            const color = getCategoryColor(card.type);
                            const indent = card.nodeType === 'flashcard' ? 48 : card.nodeType === 'concept' ? 24 : 0;
                            return (
                                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-3 relative shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600" style={{ marginLeft: indent }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-80" style={{ backgroundColor: color }} />
                                    <div className="flex items-start justify-between gap-4">
                                        <span className={`text-base text-slate-900 dark:text-slate-100 leading-snug ${card.nodeType === 'course' ? 'font-extrabold text-lg' : 'font-bold'}`}>
                                            {card.title}
                                        </span>
                                        <div className="flex gap-2 shrink-0">
                                            {card.nodeType && (
                                                <span className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                                    {card.nodeType}
                                                </span>
                                            )}
                                            {card.type && (
                                                <span className="text-[10px] font-bold py-1 px-2.5 rounded-lg uppercase tracking-wider border"
                                                      style={{ background: `${color}1a`, color: color, borderColor: `${color}33` }}>
                                                    {card.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {card.tags && card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {card.tags.map((tag) => (
                                                <span key={tag} className="text-[11px] font-medium py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Error and Submit Actions */}
                <div className="shrink-0 flex items-center justify-between gap-4 mt-2">
                    <div className="flex-1">
                        {error && (
                            <div className="text-red-400 text-sm font-bold flex items-center gap-2 bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-xl">
                                <Warning size={18} weight="bold" /> {error}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="btn-secondary px-6">
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={parsedCards.length === 0 || !!error}
                            className="btn-primary !bg-emerald-600 hover:!bg-emerald-500 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={18} weight="bold" />
                            Importer
                        </button>
                    </div>
                </div>
            </div>

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
        <div className="fixed inset-0 bg-white dark:bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
            <div className="relative w-full max-w-[1200px] h-[80vh] shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 bg-slate-50 dark:bg-slate-950 overflow-hidden" ref={modalRef as any}>
                <button onClick={props.onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-white dark:bg-slate-900 transition-colors z-10"><X size={20} weight="bold" /></button>
                <BatchImportContent {...props} />
            </div>
        </div>
    );
};
