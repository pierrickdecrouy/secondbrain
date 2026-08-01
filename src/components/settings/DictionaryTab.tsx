import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Books, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { loadCustomAbbreviations, saveCustomAbbreviations } from '../../storage';
import { S, SettingsCard, CardSection, CardBody, SettingsInput, PrimaryButton, Badge } from './SettingsUI';
import './styles/DictionaryTab.css';

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
        <div className="dictionarytab-style-1" >
            {/* Add form */}
            <SettingsCard>
                <CardSection
                    title="Nouvelle abréviation"
                    subtitle="Ajoutez un terme et sa définition complète."
                />
                <CardBody>
                    <form onSubmit={handleAdd} className="dictionarytab-style-2" >
                        <div>
                            <div className="dictionarytab-style-3" style={{
  color: S.muted
}}>
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
                            <div className="dictionarytab-style-4" style={{
  color: S.muted
}}>
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
                <div className="dictionarytab-style-5" style={{
  borderBottom: `1px solid ${S.border}`
}}>
                    <div className="dictionarytab-style-6" >
                        <MagnifyingGlass size={15} className="dictionarytab-style-7" style={{
  color: S.muted
}} />
                        <input
                            type="text"
                            placeholder="Rechercher…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="dictionarytab-style-8" style={{
  border: `1px solid ${S.border}`,
  color: S.text,
  background: S.bg
}}
                        />
                    </div>
                    <Badge>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</Badge>
                </div>

                {/* Rows */}
                <div className="dictionarytab-style-9" >
                    {filtered.length === 0 ? (
                        <div className="dictionarytab-style-10" style={{
  color: S.muted
}}>
                            <Books size={40} weight="duotone" className="dictionarytab-style-11"  />
                            <div className="dictionarytab-style-12" >Aucune abréviation</div>
                            <div className="dictionarytab-style-13" >Utilisez le formulaire ci-dessus pour en ajouter.</div>
                        </div>
                    ) : (
                        filtered.map(([key, value], i) => (
                            <div
                                key={key}
                                className="dictionarytab-style-14" style={{
  borderBottom: i < filtered.length - 1 ? `1px solid ${S.border}` : 'none'
}}
                                onMouseEnter={e => { e.currentTarget.style.background = S.surfaceHover; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div className="dictionarytab-style-15" >
                                    <code className="dictionarytab-style-16" style={{
  color: S.primary,
  background: S.primaryDim,
  border: `1px solid ${S.primaryBorder}`
}}>
                                        {key}
                                    </code>
                                    <span className="dictionarytab-style-17" style={{
  color: S.text
}}>
                                        {value}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(key)}
                                    title="Supprimer"
                                    className="dictionarytab-style-18" style={{
  color: S.muted
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
                    <div className="dictionarytab-style-19" style={{
  borderTop: `1px solid ${S.border}`,
  color: S.muted
}}>
                        <span>{filtered.length} sur {Object.keys(abbreviations).length} entrée{Object.keys(abbreviations).length !== 1 ? 's' : ''}</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="dictionarytab-style-20" style={{
  color: S.primary
}}
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
