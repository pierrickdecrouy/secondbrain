import React from 'react';
import { Trash, Export, CheckSquare, X, DownloadSimple } from '@phosphor-icons/react';
import type { Card } from '../types';
import { exportToAnki } from '../utils/ankiExport';

interface BrowseSelectionBarProps {
    selectedIds: Set<string>;
    allCards: Card[];
    onDeleteSelected: () => void;
    onSelectAll: () => void;
    onClear: () => void;
}

export const BrowseSelectionBar: React.FC<BrowseSelectionBarProps> = ({
    selectedIds,
    allCards,
    onDeleteSelected,
    onSelectAll,
    onClear,
}) => {
    const count = selectedIds.size;
    const selectedCards = allCards.filter(c => selectedIds.has(c.id));

    const handleExportAnki = () => {
        exportToAnki('Sélection', selectedCards);
    };

    const handleExportJson = () => {
        const json = JSON.stringify(selectedCards, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${count}_fiches_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]" role="toolbar" aria-label="Barre d'actions multi-sélection">
            <span className="text-[0.85rem] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {count} fiche{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}
            </span>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

            <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:brightness-110 hover:-translate-y-px bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                onClick={onSelectAll}
                title="Tout sélectionner"
            >
                <CheckSquare size={15} weight="bold" />
                Tout
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

            <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:brightness-110 hover:-translate-y-px bg-blue-500/12 text-blue-400"
                onClick={handleExportAnki}
                title="Exporter vers Anki"
            >
                <Export size={15} weight="bold" />
                Anki
            </button>

            <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:brightness-110 hover:-translate-y-px bg-purple-500/12 text-purple-400"
                onClick={handleExportJson}
                title="Exporter en JSON"
            >
                <DownloadSimple size={15} weight="bold" />
                JSON
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

            <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:brightness-110 hover:-translate-y-px bg-red-500/12 text-red-400"
                onClick={onDeleteSelected}
                title="Supprimer la sélection"
            >
                <Trash size={15} weight="bold" />
                Supprimer
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

            <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:brightness-110 hover:-translate-y-px bg-transparent text-slate-500 dark:text-slate-400"
                onClick={onClear}
                title="Annuler la sélection"
            >
                <X size={15} weight="bold" />
                Annuler
            </button>
        </div>
    );
};
