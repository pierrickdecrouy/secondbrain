import React from 'react';
import type { Card } from '../../types';

interface FlashcardEditorProps {
    formData: Partial<Card>;
    setFormData: (data: Partial<Card>) => void;
}

export const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ formData, setFormData }) => {
    return (
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type de Flashcard</label>
                <select
                    value={formData.format || 'q&a'}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    style={{ maxWidth: 220 }}
                >
                    <option value="q&a">Question / Réponse</option>
                    <option value="cloze">Texte à trous</option>
                </select>
            </div>

            {formData.format === 'cloze' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contenu <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85em' }}>— Entourez les mots avec {'{accolades}'}</span></label>
                    <textarea
                        value={formData.content || ''}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={5}
                        placeholder={`Exemple: L'enzyme {Troponine} s'élève lors d'un IDM.`}
                    />
                </div>
            ) : (
                <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Question <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85em' }}>(Recto)</span></label>
                        <textarea
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            rows={3}
                            placeholder="Quelle est la question ?"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Réponse <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85em' }}>(Verso)</span></label>
                        <textarea
                            value={formData.details || ''}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            rows={5}
                            placeholder="Quelle est la réponse ?"
                        />
                    </div>
                </>
            )}
        </div>
    );
};
