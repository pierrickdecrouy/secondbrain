import React from 'react';
import { X, Tag, PencilSimple, Trash } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { useCards } from '../context/CardContext';

export const TagManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { cards, setCards } = useCards();

    const allTags = Array.from(new Set(
        cards.flatMap(c => c.tags || [])
             .filter(t => !t.startsWith('_group:'))
    )).sort((a, b) => a.localeCompare(b));

    const handleRenameTag = (oldTag: string) => {
        const newTag = window.prompt(`Renommer l'étiquette "${oldTag}" en :`, oldTag);
        if (newTag && newTag.trim() !== '' && newTag !== oldTag) {
            setCards(prev => prev.map(c => {
                if (c.tags && c.tags.includes(oldTag)) {
                    return { ...c, tags: c.tags.map(t => t === oldTag ? newTag.trim() : t) };
                }
                return c;
            }));
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        if (window.confirm(`Voulez-vous vraiment supprimer l'étiquette "${tagToDelete}" de toutes vos fiches et cours ?`)) {
            setCards(prev => prev.map(c => {
                if (c.tags && c.tags.includes(tagToDelete)) {
                    return { ...c, tags: c.tags.filter(t => t !== tagToDelete) };
                }
                return c;
            }));
        }
    };

    return createPortal(
        <div className="card-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ zIndex: 10000, position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card-form app-card-form" style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div className="card-form-header app-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={20} /> Gestion des Étiquettes</h2>
                    <button className="close-btn app-close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                </div>
                
                <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        Gérez ici l'ensemble de vos étiquettes (tags). Notez que les tags aident le moteur de recherche à trouver plus facilement vos contenus.
                    </p>
                    
                    {allTags.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                            Aucune étiquette pour le moment.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {allTags.map(tag => (
                                <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
                                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Tag size={16} color="var(--color-primary)" /> {tag}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleRenameTag(tag)} title="Renommer" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', padding: '6px', color: 'var(--color-text)' }}>
                                            <PencilSimple size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTag(tag)} title="Supprimer" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', padding: '6px', color: 'var(--color-danger)' }}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
