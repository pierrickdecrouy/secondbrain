import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Books, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { loadCustomAbbreviations, saveCustomAbbreviations } from '../../storage';
import { SettingsCard, CardSection, CardBody, SettingsInput, PrimaryButton, Badge } from './SettingsUI';

export const DictionaryTab: React.FC = () => {
    const [abbreviations, setAbbreviations] = useState<{ [key: string]: string }>({});
    const [abbrvKey, setAbbrvKey] = useState('');
    const [abbrvValue, setAbbrvValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setAbbreviations(loadCustomAbbreviations());
    }, []);

    const handleAdd = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const k = abbrvKey.trim();
        const v = abbrvValue.trim();
        if (k && v) {
            const updated = { ...abbreviations, [k.toLowerCase()]: v };
            setAbbreviations(updated);
            saveCustomAbbreviations(updated);
            setAbbrvKey('');
            setAbbrvValue('');
        }
    };

    const handleDelete = (key: string) => {
        const updated = { ...abbreviations };
        delete updated[key];
        setAbbreviations(updated);
        saveCustomAbbreviations(updated);
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return Object.entries(abbreviations)
            .filter(([k, v]) => k.includes(q) || v.toLowerCase().includes(q))
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [abbreviations, searchQuery]);

    const canSubmit = abbrvKey.trim() && abbrvValue.trim();

    return (
        <div className="flex flex-col gap-6">
            {/* Add form */}
            <SettingsCard>
                <CardSection
                    title="Nouvelle abréviation"
                    subtitle="Ajoutez un terme et sa définition complète."
                />
                <CardBody>
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 min-w-0 w-full">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Abréviation
                            </div>
                            <SettingsInput
                                type="text"
                                required
                                placeholder="ex: HTA"
                                value={abbrvKey}
                                onChange={e => setAbbrvKey(e.target.value)}
                            />
                        </div>
                        <div className="flex-[2] min-w-0 w-full">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Signification
                            </div>
                            <SettingsInput
                                type="text"
                                required
                                placeholder="ex: Hypertension Artérielle"
                                value={abbrvValue}
                                onChange={e => setAbbrvValue(e.target.value)}
                            />
                        </div>
                        <PrimaryButton 
                            type="submit" 
                            disabled={!canSubmit}
                            className={`w-full sm:w-auto ${!canSubmit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                        >
                            <Plus size={16} weight="bold" /> Ajouter
                        </PrimaryButton>
                    </form>
                </CardBody>
            </SettingsCard>

            {/* List */}
            <SettingsCard>
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Rechercher…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-slate-100 transition-all"
                        />
                    </div>
                    <Badge>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</Badge>
                </div>

                {/* Rows */}
                <div className="flex flex-col">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <Books size={48} weight="duotone" className="text-slate-300 dark:text-slate-600 mb-4" />
                            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Aucune abréviation</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Utilisez le formulaire ci-dessus pour en ajouter.</div>
                        </div>
                    ) : (
                        filtered.map(([key, value], i) => (
                            <div
                                key={key}
                                className={`flex items-center justify-between px-6 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                    i < filtered.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <code className="text-[13px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 px-2 py-0.5 rounded-md shrink-0">
                                        {key}
                                    </code>
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                        {value}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(key)}
                                    title="Supprimer"
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 ml-2"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{filtered.length} sur {Object.keys(abbreviations).length} entrée{Object.keys(abbreviations).length !== 1 ? 's' : ''}</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                            >
                                Effacer filtre
                            </button>
                        )}
                    </div>
                )}
            </SettingsCard>
        </div>
    );
};
