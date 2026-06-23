import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Books, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { loadCustomAbbreviations, saveCustomAbbreviations } from '../../storage';
import { S, SettingsCard, CardSection, CardBody, SettingsInput, PrimaryButton, Badge } from './SettingsUI';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Add form */}
            <SettingsCard>
                <CardSection
                    title="Nouvelle abréviation"
                    subtitle="Ajoutez un terme et sa définition complète."
                />
                <CardBody>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '2fr 5fr auto', gap: 12, alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                        <PrimaryButton type="submit" style={{ opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
                            <Plus size={15} weight="bold" /> Ajouter
                        </PrimaryButton>
                    </form>
                </CardBody>
            </SettingsCard>

            {/* List */}
            <SettingsCard>
                {/* Toolbar */}
                <div style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${S.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                        <MagnifyingGlass size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: S.muted, pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Rechercher…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                border: `1px solid ${S.border}`,
                                borderRadius: 8,
                                fontSize: 13,
                                color: S.text,
                                background: S.bg,
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <Badge>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</Badge>
                </div>

                {/* Rows */}
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: S.muted }}>
                            <Books size={40} weight="duotone" style={{ opacity: 0.3 }} />
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Aucune abréviation</div>
                            <div style={{ fontSize: 13, opacity: 0.7 }}>Utilisez le formulaire ci-dessus pour en ajouter.</div>
                        </div>
                    ) : (
                        filtered.map(([key, value], i) => (
                            <div
                                key={key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 20px',
                                    borderBottom: i < filtered.length - 1 ? `1px solid ${S.border}` : 'none',
                                    transition: 'background 0.1s',
                                    gap: 16,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = S.surfaceHover; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 0 }}>
                                    <code style={{
                                        fontFamily: 'monospace',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: S.primary,
                                        background: S.primaryDim,
                                        border: `1px solid ${S.primaryBorder}`,
                                        padding: '2px 10px',
                                        borderRadius: 6,
                                        textTransform: 'uppercase',
                                        flexShrink: 0,
                                        minWidth: 60,
                                        textAlign: 'center',
                                    }}>
                                        {key}
                                    </code>
                                    <span style={{ fontSize: 14, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {value}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(key)}
                                    title="Supprimer"
                                    style={{
                                        padding: 6,
                                        background: 'transparent',
                                        border: 'none',
                                        color: S.muted,
                                        cursor: 'pointer',
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = S.danger; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = S.muted; }}
                                >
                                    <Trash size={15} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div style={{
                        padding: '10px 20px',
                        borderTop: `1px solid ${S.border}`,
                        fontSize: 12,
                        color: S.muted,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span>{filtered.length} sur {Object.keys(abbreviations).length} entrée{Object.keys(abbreviations).length !== 1 ? 's' : ''}</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: S.primary, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
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
