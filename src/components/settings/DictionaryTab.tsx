import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Books, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { loadCustomAbbreviations, saveCustomAbbreviations } from '../../storage';

export const DictionaryTab: React.FC = () => {
    const [abbreviations, setAbbreviations] = useState<{ [key: string]: string }>({});
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loaded = loadCustomAbbreviations();
        setAbbreviations(loaded);
    }, []);

    const handleAdd = () => {
        if (newKey && newValue) {
            const updated = { ...abbreviations, [newKey.toLowerCase()]: newValue };
            setAbbreviations(updated);
            saveCustomAbbreviations(updated);
            setNewKey('');
            setNewValue('');
        }
    };

    const handleDelete = (key: string) => {
        const updated = { ...abbreviations };
        delete updated[key];
        setAbbreviations(updated);
        saveCustomAbbreviations(updated);
    };

    const filteredAbbreviations = useMemo(() => {
        return Object.entries(abbreviations).filter(([key, value]) =>
            key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            value.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => a[0].localeCompare(b[0]));
    }, [abbreviations, searchQuery]);

    return (
        <div className="flex-1 p-5 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)] flex flex-col h-full">
            {/* Formulaire d'ajout */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6">
                <h3 className="text-[1.1rem] font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                    <div className="bg-[#4fb28626] text-[var(--color-drug)] p-1 rounded-full flex">
                        <Plus size={16} />
                    </div>
                    Ajouter une définition
                </h3>
                <div className="flex gap-4 items-center flex-wrap">
                    <input
                        type="text"
                        placeholder="Ex: IV"
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] py-3 px-4 rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-[var(--color-drug)] focus:ring-[3px] focus:ring-[#4fb28626] flex-1 min-w-0 flex-[1_1_120px]"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Ex: Intraveineuse"
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] py-3 px-4 rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-[var(--color-drug)] focus:ring-[3px] focus:ring-[#4fb28626] flex-1 min-w-0 flex-[2_1_200px]"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        className={`bg-[var(--color-drug)] text-white border-none py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${(!newKey || !newValue) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-90 active:scale-95'} flex-none`} 
                        onClick={handleAdd}
                        disabled={!newKey || !newValue}
                    >
                        <Plus size={16} weight="bold" /> Ajouter
                    </button>
                </div>
            </div>

            {/* Liste Bibliothèque */}
            <div className="mt-5 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--color-border)]">
                    <div className="text-[0.85rem] font-bold text-[var(--color-text-muted)] tracking-wide uppercase flex items-center">
                        <Books size={16} className="mr-2" />
                        Bibliothèque <span className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] py-0.5 px-2 rounded-xl text-xs ml-2 font-semibold">{Object.keys(abbreviations).length}</span>
                    </div>
                    <div className="relative flex items-center">
                        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="py-2 pr-3 pl-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[0.9rem] w-[200px] transition-all duration-200 text-[var(--color-text)] focus:border-[var(--color-drug)] outline-none focus:ring-[3px] focus:ring-[#4fb28626]"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)]">
                    {/* Items */}
                    {filteredAbbreviations.map(([key, value]) => (
                        <div key={key} className="group flex items-center px-4 py-3 border-b border-[var(--color-border)] transition-all duration-200 cursor-default bg-[var(--color-surface)] first:rounded-t-xl last:border-b-0 last:rounded-b-xl hover:bg-[var(--color-border)]">
                            <div className="min-w-[65px] text-center bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] font-semibold text-xs py-1.5 px-2.5 rounded-full mr-5 lowercase">{key}</div>
                            <div className="text-[var(--color-text)] text-[0.95rem] flex-1 font-normal first-letter:uppercase">{value}</div>
                            <Trash
                                size={16}
                                className="opacity-0 text-red-500 cursor-pointer p-2 rounded-md transition-all duration-200 hover:bg-red-500/10 group-hover:opacity-100"
                                onClick={() => handleDelete(key)}
                            />
                        </div>
                    ))}

                    {filteredAbbreviations.length === 0 && (
                        <div className="text-center p-10 text-[var(--color-text-muted)]">
                            <MagnifyingGlass size={32} className="mx-auto mb-2.5 opacity-30" />
                            <p className="text-[0.9rem]">Aucun résultat trouvé.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
