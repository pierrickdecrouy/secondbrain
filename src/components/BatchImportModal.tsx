import React, { useState, useEffect } from 'react';
import { X, UploadSimple, Warning, FileText, FileCode, Info } from '@phosphor-icons/react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Card, CardType } from '../types';
import { validateImportData } from '../utils/importValidation';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useTheme } from '../context/ThemeContext';

import { parseJsonFormat, parseTextFormat } from '../utils/importParser';

interface BatchImportModalProps {
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    existingCards?: Card[];
}

type ImportMode = 'json' | 'text';

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
                processed = parseJsonFormat(trimmed, cardType, groupName);
            } else {
                processed = parseTextFormat(input, cardType, groupName);
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
        <div className="grid grid-cols-[1.5fr_1fr] h-[600px] w-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden">
            {/* Left Pane: Editor */}
            <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900">
                
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${importMode === 'text' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            onClick={() => { setImportMode('text'); }}
                        >
                            <FileText size={16} />
                            Texte
                        </button>
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${importMode === 'json' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            onClick={() => { setImportMode('json'); }}
                        >
                            <FileCode size={16} />
                            JSON
                        </button>
                    </div>

                    <button
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${showHelp ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        <Info size={18} />
                        Guide
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Type par défaut</label>
                        <select 
                            value={cardType} 
                            onChange={(e) => setCardType(e.target.value as CardType)}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Groupe (Optionnel)</label>
                        <input
                            type="text"
                            placeholder="Ex: Cardiologie, Cours N°1..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <textarea
                    className={`flex-1 resize-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${importMode === 'json' ? 'font-mono' : 'font-sans'}`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={importMode === 'text' ? '# Titre de la fiche\nSous-titre\n[Tag1, Tag2]\n\nContenu détaillé ici...' : '[\n  {\n    "title": "Nom de la fiche",\n    "tags": ["tag1"]\n  }\n]'}
                />

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Warning size={16} weight="bold" />
                        {error}
                    </div>
                )}
            </div>

            {/* Right Pane: Preview / Help */}
            <div className="flex flex-col bg-white dark:bg-slate-800 overflow-hidden">
                {showHelp ? (
                    <div className="p-6 overflow-y-auto h-full prose prose-slate dark:prose-invert prose-sm">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 mt-0">Guide d'importation</h3>
                        
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                                <FileText size={16} className="text-blue-500" /> Format Texte (#)
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 mb-2">Utilisez le croisillon # pour délimiter vos fiches.</p>
                            <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-xs">
{`# Aspirine
Anti-inflammatoire non stéroïdien
[Douleur, Fièvre, AINS]
Matière: Pharmacologie

## Mécanisme
Inhibe irréversiblement les COX.`}
                            </pre>
                        </div>

                        <div>
                            <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                                <FileCode size={16} className="text-purple-500" /> Format JSON
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 mb-2">Importez un tableau d'objets JSON valides.</p>
                            <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-xs">
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
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                            <h3 className="m-0 text-base font-semibold text-slate-800 dark:text-slate-100">Prévisualisation</h3>
                            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                                {parsedCards.length}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50">
                            {parsedCards.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm text-center p-8 italic">
                                    Saisissez vos données à gauche pour voir l'aperçu.
                                </div>
                            ) : (
                                parsedCards.map((card, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-1.5 shadow-sm">
                                        <div className="flex justify-between items-start gap-2">
                                            <strong className="text-sm text-slate-800 dark:text-slate-200 leading-tight">{card.title}</strong>
                                            {card.type && (
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                                                    {card.type}
                                                </span>
                                            )}
                                        </div>
                                        {card.tags && card.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {card.tags.map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ color: getCategoryColor('default'), background: `${getCategoryColor('default')}20` }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3 bg-white dark:bg-slate-800 shrink-0">
                            <button className="flex-1 px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors" onClick={onClose}>
                                Annuler
                            </button>
                            <button
                                className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 shadow-sm"
                                onClick={handleImport}
                                disabled={parsedCards.length === 0 || !!error}
                            >
                                <UploadSimple size={18} weight="bold" />
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
                    confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
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
    const modalRef = useFocusTrap(true);
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
            <div className="relative w-full max-w-[1000px] shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200" ref={modalRef as any}>
                <button 
                    onClick={props.onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors z-10"
                >
                    <X size={20} />
                </button>
                <BatchImportContent {...props} />
            </div>
        </div>
    );
};

