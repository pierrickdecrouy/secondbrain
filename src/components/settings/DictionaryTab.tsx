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
        <div className="settings-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Formulaire d'ajout */}
            <div className="settings-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--color-drug)', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                        <Plus size={16} />
                    </div>
                    Ajouter une définition
                </h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Ex: IV"
                        className="input-field"
                        style={{ flex: '1 1 120px', minWidth: 0 }}
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Ex: Intraveineuse"
                        className="input-field"
                        style={{ flex: '2 1 200px', minWidth: 0 }}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        className="btn-add" 
                        onClick={handleAdd}
                        disabled={!newKey || !newValue}
                        style={{ opacity: (!newKey || !newValue) ? 0.5 : 1, flex: '0 0 auto' }}
                    >
                        <Plus size={16} weight="bold" /> Ajouter
                    </button>
                </div>
            </div>

            {/* Liste Bibliothèque */}
            <div className="list-section">
                <div className="list-header">
                    <div className="list-title">
                        <Books size={16} style={{ marginRight: 8 }} />
                        Bibliothèque <span className="counter">{Object.keys(abbreviations).length}</span>
                    </div>
                    <div className="search-box">
                        <MagnifyingGlass size={14} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="scroll-area">
                    {/* Items */}
                    {filteredAbbreviations.map(([key, value]) => (
                        <div key={key} className="definition-row">
                            <div className="badge">{key}</div>
                            <div className="def-text">{value}</div>
                            <Trash
                                size={16}
                                className="delete-icon"
                                onClick={() => handleDelete(key)}
                            />
                        </div>
                    ))}

                    {filteredAbbreviations.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                            <MagnifyingGlass size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.9rem' }}>Aucun résultat trouvé.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
