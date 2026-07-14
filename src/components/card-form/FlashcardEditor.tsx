import React from 'react';
import type { Card } from '../../types';

interface FlashcardEditorProps {
    formData: Partial<Card>;
    setFormData: (data: Partial<Card>) => void;
}

export const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ formData, setFormData }) => {
    return (
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                    Contenu de la carte
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg)', padding: '6px 16px', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Format</span>
                    <select
                        value={formData.format || 'q&a'}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', outline: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        <option value="q&a">Question / Réponse</option>
                        <option value="cloze">Texte à trous</option>
                    </select>
                </div>
            </div>

            {formData.format === 'cloze' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Texte à trous <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>— Entourez les mots à cacher avec {'{accolades}'}</span>
                    </label>
                    <textarea
                        value={formData.content || ''}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder={`Exemple: L'enzyme {Troponine} s'élève lors d'un IDM.`}
                        style={{
                            flex: 1,
                            minHeight: 200,
                            padding: '24px',
                            fontSize: '1.2rem',
                            lineHeight: 1.6,
                            border: '1px solid var(--color-border)',
                            borderRadius: 16,
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
                    {/* Recto / Question */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Question <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>(Recto)</span>
                        </label>
                        <textarea
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Quelle est la question ?"
                            style={{
                                width: '100%',
                                minHeight: 100,
                                padding: '20px 24px',
                                fontSize: '1.4rem',
                                fontWeight: 700,
                                border: '1px solid var(--color-border)',
                                borderRadius: 16,
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.4,
                            }}
                        />
                    </div>

                    {/* Verso / Réponse */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Réponse <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>(Verso)</span>
                        </label>
                        <textarea
                            value={formData.details || ''}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            placeholder="Écrivez la réponse détaillée ici..."
                            style={{
                                width: '100%',
                                flex: 1,
                                minHeight: 160,
                                padding: '20px 24px',
                                fontSize: '1.1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 16,
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.6,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
