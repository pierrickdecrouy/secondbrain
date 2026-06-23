import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Books, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { loadCustomAbbreviations, saveCustomAbbreviations } from '../../storage';

export const DictionaryTab: React.FC = () => {
    const [abbreviations, setAbbreviations] = useState<{ [key: string]: string }>({});
    const [abbrvKey, setAbbrvKey] = useState('');
    const [abbrvValue, setAbbrvValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loaded = loadCustomAbbreviations();
        setAbbreviations(loaded);
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

    const filteredAbbreviations = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return Object.entries(abbreviations).filter(([key, value]) =>
            key.toLowerCase().includes(query) ||
            value.toLowerCase().includes(query)
        ).sort((a, b) => a[0].localeCompare(b[0]));
    }, [abbreviations, searchQuery]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Banner Section */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(to right, #111827, #1e293b)',
                padding: 32, borderRadius: 16,
                border: '1px solid rgba(46, 62, 82, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Dictionnaire
                        <span style={{
                            fontSize: 12, fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399', padding: '2px 8px', borderRadius: 9999,
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            {Object.keys(abbreviations).length} Abréviations
                        </span>
                    </h2>
                    <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                        Gérez, ajoutez et éditez vos abréviations médicales ou scientifiques et leurs définitions globales.
                    </p>
                </div>
                <div style={{
                    position: 'absolute', right: 0, top: 0, width: 256, height: 256,
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%',
                    filter: 'blur(40px)', pointerEvents: 'none'
                }}></div>
            </div>

            {/* Add Abbreviation Card */}
            <div style={{ backgroundColor: '#0f1420', borderRadius: 16, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Nouvelle abréviation</h3>
                </div>
                <div style={{ padding: 24 }}>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, alignItems: 'end', margin: 0 }}>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Abréviation
                            </label>
                            <input 
                                type="text" required placeholder="ex: HTA" 
                                value={abbrvKey} onChange={(e) => setAbbrvKey(e.target.value)} 
                                style={{
                                    width: '100%', boxSizing: 'border-box', backgroundColor: '#0b0f17', border: '1px solid #334155',
                                    color: '#e2e8f0', fontSize: 14, borderRadius: 12, padding: '12px 16px', outline: 'none'
                                }} 
                            />
                        </div>
                        <div style={{ gridColumn: 'span 7' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Signification complète
                            </label>
                            <input 
                                type="text" required placeholder="ex: Hypertension Artérielle" 
                                value={abbrvValue} onChange={(e) => setAbbrvValue(e.target.value)} 
                                style={{
                                    width: '100%', boxSizing: 'border-box', backgroundColor: '#0b0f17', border: '1px solid #334155',
                                    color: '#e2e8f0', fontSize: 14, borderRadius: 12, padding: '12px 16px', outline: 'none'
                                }} 
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <button 
                                type="submit" disabled={!abbrvKey.trim() || !abbrvValue.trim()} 
                                style={{
                                    width: '100%', boxSizing: 'border-box', backgroundColor: '#059669', color: 'white',
                                    fontSize: 14, fontWeight: 600, borderRadius: 12, padding: '12px 16px', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    cursor: (!abbrvKey.trim() || !abbrvValue.trim()) ? 'not-allowed' : 'pointer',
                                    opacity: (!abbrvKey.trim() || !abbrvValue.trim()) ? 0.5 : 1
                                }}
                            >
                                <Plus size={16} weight="bold" />
                                Ajouter
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Main List Card */}
            <div style={{ backgroundColor: '#0f1420', borderRadius: 16, border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* List Toolbar */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', pointerEvents: 'none' }}>
                            <MagnifyingGlass size={16} />
                        </span>
                        <input 
                            type="text" placeholder="Rechercher une abréviation..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                            style={{
                                width: '100%', boxSizing: 'border-box', backgroundColor: '#0b0f17', border: '1px solid #334155',
                                color: '#e2e8f0', fontSize: 14, borderRadius: 8, padding: '8px 16px 8px 36px', outline: 'none'
                            }} 
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: 6 }}>Tout plier</button>
                        <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: 6 }}>Tout déplier</button>
                    </div>
                </div>

                {/* List View */}
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    {filteredAbbreviations.length === 0 ? (
                        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Books size={48} weight="duotone" style={{ marginBottom: 16, opacity: 0.2 }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>Aucune abréviation trouvée.</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: 14, opacity: 0.7 }}>Utilisez le formulaire ci-dessus pour en ajouter.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {filteredAbbreviations.map(([key, value], index) => (
                                <div key={key} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px 24px', borderBottom: index === filteredAbbreviations.length - 1 ? 'none' : '1px solid #1e293b'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                        <div style={{ width: 80, fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#f1f5f9', textTransform: 'uppercase' }}>
                                            {key}
                                        </div>
                                        <div style={{ fontSize: 15, color: '#94a3b8' }}>
                                            {value}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(key)}
                                        style={{
                                            padding: 8, backgroundColor: 'transparent', border: 'none',
                                            color: '#64748b', cursor: 'pointer', display: 'flex', borderRadius: 8
                                        }}
                                        title="Supprimer"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Affichage de {filteredAbbreviations.length} abréviations</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button style={{ padding: 6, borderRadius: 8, backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'flex' }}>
                            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>1</span>
                        <button style={{ padding: 6, borderRadius: 8, backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'flex' }}>
                            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
