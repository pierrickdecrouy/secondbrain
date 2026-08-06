// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, UploadSimple, Warning, FileText, FileCode, Info,
    CheckCircle, CloudArrowUp, Table, Cards, GitMerge
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
        icon: <FileText size={18} weight="duotone" />,
        color: '#10B981', // emerald
        accent: 'rgba(16, 185, 129, 0.08)',
    },
    json: {
        label: 'JSON',
        icon: <FileCode size={18} weight="duotone" />,
        color: '#8B5CF6', // violet
        accent: 'rgba(139, 92, 246, 0.08)',
    },
    csv: {
        label: 'CSV / Excel',
        icon: <Table size={18} weight="duotone" />,
        color: '#F59E0B', // amber
        accent: 'rgba(245, 158, 11, 0.08)',
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

        // Auto-detect mode
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            if (currentMode !== 'json') { setImportMode('json'); currentMode = 'json'; }
        } else if (
            (trimmed.includes(';') || trimmed.includes(',')) &&
            trimmed.split('\n')[0].split(/[;,]/).length > 1 &&
            !trimmed.startsWith('#')
        ) {
            if (currentMode !== 'csv') { setImportMode('csv'); currentMode = 'csv'; }
        } else if (trimmed.startsWith('#')) {
            if (currentMode !== 'text') { setImportMode('text'); currentMode = 'text'; }
        }

        // Parse
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
            setError(err instanceof Error ? (err as Error).message : "Erreur lors de l'import");
        }
    };

    const activeMeta = MODE_META[importMode];

    return (
        <div className="flex flex-col lg:flex-row flex-1 h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 backdrop-blur-xl">
            {/* LEFT PANE: Editor (Glassy styling) */}
            <div className="flex-[1.2] flex flex-col gap-6 p-6 sm:p-8 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 z-10 relative overflow-hidden">
                {/* Header & Modes */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between shrink-0 gap-4">
                    <h3 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 m-0">
                        Ajout Massif
                    </h3>
                    
                    <div className="relative flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[14px] border border-slate-300/30 dark:border-slate-700/50 shadow-inner">
                        {(Object.keys(MODE_META) as ImportMode[]).map((m) => {
                            const meta = MODE_META[m];
                            const isActive = importMode === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => setImportMode(m)}
                                    className={`relative flex items-center gap-2 py-2 px-4 text-[13px] font-bold rounded-[10px] transition-colors z-10 outline-none ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="importModeActiveBg" 
                                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" 
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
                                        />
                                    )}
                                    <span style={{ color: isActive ? meta.color : 'inherit' }} className="relative z-10">{meta.icon}</span>
                                    <span className="relative z-10 hidden sm:inline">{meta.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <div className="relative flex-1 w-full group">
                        <input
                            type="text"
                            placeholder="Assigner un groupe (ex: Cours 3)..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full py-3 px-4 pl-10 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm placeholder:text-slate-400"
                        />
                        <GitMerge size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" weight="duotone" />
                    </div>
                    <label className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-sm font-bold cursor-pointer transition-all shadow-sm w-full sm:w-auto">
                        <UploadSimple size={18} weight="duotone" className="text-indigo-500" /> 
                        Parcourir...
                        <input type="file" accept=".txt,.json,.csv,.tsv,.md" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileLoad(file); e.target.value = ''; }} />
                    </label>
                </div>

                {/* Editor Textarea with Drag & Drop glow */}
                <motion.div 
                    animate={{ 
                        borderColor: isDragOver ? activeMeta.color : 'rgba(203, 213, 225, 0.5)',
                        backgroundColor: isDragOver ? activeMeta.accent : 'rgba(255, 255, 255, 0.5)'
                    }}
                    className={`flex-1 relative rounded-[24px] border-2 transition-colors overflow-hidden shadow-inner flex flex-col ${isDragOver ? 'border-solid' : 'border-dashed dark:border-slate-700/50 dark:bg-slate-900/50'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileLoad(file); }}
                >
                    <AnimatePresence>
                        {!input && !isDragOver && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none text-slate-400 dark:text-slate-500 z-0"
                            >
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }} 
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="p-6 rounded-full bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm"
                                >
                                    <CloudArrowUp size={48} weight="duotone" />
                                </motion.div>
                                <p className="text-lg font-medium text-center m-0 px-8">
                                    Collez votre contenu ou glissez un fichier ici<br />
                                    <span className="text-sm opacity-70 font-normal">Formats supportés : TXT, Markdown, JSON, CSV</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Gradient background effect based on mode */}
                    <div 
                        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 z-0" 
                        style={{ background: `radial-gradient(circle at top right, ${activeMeta.color}, transparent 60%)` }} 
                    />

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isDragOver ? '' : PLACEHOLDERS[importMode]}
                        className={`absolute inset-0 w-full h-full resize-none border-none bg-transparent text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed p-6 sm:p-8 outline-none focus:ring-0 custom-scrollbar z-10 ${importMode === 'json' ? 'font-mono text-sm' : 'font-sans'}`}
                    />
                </motion.div>
            </div>

            {/* RIGHT PANE: Live Preview */}
            <div className="flex-[0.8] lg:max-w-[45%] flex flex-col gap-6 p-6 sm:p-8 bg-slate-100/30 dark:bg-slate-950/30 relative overflow-hidden">
                <div className="flex items-center justify-between shrink-0 h-10">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0 flex items-center gap-2">
                        Aperçu en direct
                    </h3>
                    <AnimatePresence>
                        {parsedCards.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-1.5 px-4 rounded-full text-[13px] font-bold shadow-sm"
                            >
                                <Cards size={16} weight="duotone" className="text-indigo-500" /> 
                                {parsedCards.length} élément(s)
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 relative rounded-2xl overflow-hidden shadow-inner bg-slate-200/20 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                            {parsedCards.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center opacity-40 text-slate-500 dark:text-slate-400"
                                >
                                    <Info size={48} weight="duotone" className="mb-4" />
                                    <p className="text-lg font-medium m-0">En attente de contenu...</p>
                                </motion.div>
                            ) : (
                                parsedCards.map((card, idx) => {
                                    const color = getCategoryColor(card.type);
                                    const isCourse = card.nodeType === 'course';
                                    const isConcept = card.nodeType === 'concept';
                                    const isFlashcard = card.nodeType === 'flashcard';
                                    
                                    // Visual hierarchy indentation
                                    const indentAmount = isFlashcard ? 32 : isConcept ? 16 : 0;
                                    
                                    return (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            transition={{ type: "spring", bounce: 0.3, duration: 0.6, delay: Math.min(idx * 0.05, 0.5) }} // Cap delay for large lists
                                            key={`${card.title}-${idx}`} 
                                            className="relative group"
                                            style={{ paddingLeft: indentAmount }}
                                        >
                                            {/* Connection lines for hierarchy */}
                                            {indentAmount > 0 && (
                                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-700/50 rounded-full" style={{ left: indentAmount / 2 }} />
                                            )}
                                            {indentAmount > 0 && (
                                                <div className="absolute top-6 h-[2px] w-4 bg-slate-200 dark:bg-slate-700/50 rounded-full" style={{ left: indentAmount / 2 }} />
                                            )}

                                            <div className={`p-4 rounded-[16px] bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden`}>
                                                {/* Left color bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-90" style={{ backgroundColor: color }} />
                                                
                                                {/* Subtle gradient background based on type color */}
                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
                                                
                                                <div className="flex items-start justify-between gap-4 relative z-10 pl-2">
                                                    <span className={`text-base text-slate-900 dark:text-slate-100 leading-snug ${isCourse ? 'font-black text-lg' : 'font-bold'}`}>
                                                        {card.title || <span className="text-slate-400 italic">Sans titre</span>}
                                                    </span>
                                                    
                                                    <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                                        {card.nodeType && (
                                                            <span className="text-[9px] font-extrabold py-1 px-2 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm">
                                                                {card.nodeType}
                                                            </span>
                                                        )}
                                                        {card.type && (
                                                            <span className="text-[9px] font-extrabold py-1 px-2 rounded-md uppercase tracking-widest shadow-sm"
                                                                  style={{ background: `${color}1a`, color: color }}>
                                                                {card.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {card.tags && card.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 relative z-10 pl-2">
                                                        {card.tags.map((tag) => (
                                                            <span key={tag} className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Actions & Errors */}
                <div className="shrink-0 flex flex-col gap-4 mt-2">
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, y: 10 }} 
                                animate={{ opacity: 1, height: 'auto', y: 0 }} 
                                exit={{ opacity: 0, height: 0, y: 10 }}
                                className="text-red-500 dark:text-red-400 text-sm font-bold flex items-center gap-3 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl backdrop-blur-md overflow-hidden"
                            >
                                <Warning size={20} weight="duotone" className="shrink-0" /> 
                                <span className="truncate">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="py-2.5 px-6 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:shadow-md">
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={parsedCards.length === 0 || !!error}
                            className="py-2.5 px-8 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
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
                    confirmClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onConfirm={() => { onImport(pendingImportCards); setPendingImportCards(null); setDuplicateSample(''); if (onClose) onClose(); }}
                    onCancel={() => { setPendingImportCards(null); setDuplicateSample(''); }}
                />
            )}
        </div>
    );
};

export const BatchImportModal: React.FC<BatchImportModalProps> = (props) => {
    const modalRef = useFocusTrap(true);
    
    // Disable body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[8px] z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-12" 
                onClick={(e) => e.target === e.currentTarget && props.onClose()}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                    className="relative w-full max-w-[1400px] h-full max-h-[90vh] shadow-2xl shadow-indigo-900/10 rounded-[28px] bg-white/80 dark:bg-slate-900/80 border border-white/40 dark:border-slate-700/50 overflow-hidden flex flex-col" 
                    ref={modalRef as any}
                >
                    <button 
                        onClick={props.onClose} 
                        className="absolute top-5 right-5 p-2.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100/50 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 backdrop-blur-md transition-all z-20 shadow-sm"
                        aria-label="Fermer"
                    >
                        <X size={20} weight="bold" />
                    </button>
                    
                    <BatchImportContent {...props} />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
