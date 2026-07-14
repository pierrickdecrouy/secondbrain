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
        <div className="browse-selection-bar" role="toolbar" aria-label="Barre d'actions multi-sélection">
            <span className="browse-selection-bar-count">
                {count} fiche{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}
            </span>

            <div className="browse-selection-bar-divider" />

            <button
                className="browse-selection-bar-btn bg-[color:var(--color-surface-hover)] text-[color:var(--color-text)]"
                onClick={onSelectAll}
                title="Tout sélectionner"
            >
                <CheckSquare size={15} weight="bold" />
                Tout
            </button>

            <div className="browse-selection-bar-divider" />

            <button
                className="browse-selection-bar-btn bg-blue-500/12 text-blue-400"
                onClick={handleExportAnki}
                title="Exporter vers Anki"
            >
                <Export size={15} weight="bold" />
                Anki
            </button>

            <button
                className="browse-selection-bar-btn bg-purple-500/12 text-purple-400"
                onClick={handleExportJson}
                title="Exporter en JSON"
            >
                <DownloadSimple size={15} weight="bold" />
                JSON
            </button>

            <div className="browse-selection-bar-divider" />

            <button
                className="browse-selection-bar-btn bg-red-500/12 text-red-400"
                onClick={onDeleteSelected}
                title="Supprimer la sélection"
            >
                <Trash size={15} weight="bold" />
                Supprimer
            </button>

            <div className="browse-selection-bar-divider" />

            <button
                className="browse-selection-bar-btn bg-transparent text-[color:var(--color-text-muted)]"
                onClick={onClear}
                title="Annuler la sélection"
            >
                <X size={15} weight="bold" />
                Annuler
            </button>
        </div>
    );
};
