import React from 'react';
import { X, Tag, PencilSimple, Trash } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { useCardStore as useCards } from '../store/useCardStore';
import { useFocusTrap } from '../hooks/useFocusTrap';

export const TagManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { cards, setCards } = useCards();
    const modalRef = useFocusTrap(true);

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
        <div className="card-form-overlay fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className="card-form app-card-form flex flex-col w-full max-w-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                <div className="card-form-header app-header flex justify-between items-center py-4 px-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="m-0 text-[1.2rem] font-bold flex items-center gap-2"><Tag size={20} /> Gestion des Étiquettes</h2>
                    <button className="close-btn app-close-btn bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="flex-1 py-4 px-6 overflow-y-auto">
                    <p className="m-0 text-[0.9rem] text-slate-500 dark:text-slate-400 mb-4">
                        Gérez ici l'ensemble de vos étiquettes (tags). Notez que les tags aident le moteur de recherche à trouver plus facilement vos contenus.
                    </p>
                    
                    {allTags.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            Aucune étiquette pour le moment.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {allTags.map(tag => (
                                <div key={tag} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
                                    <span className="font-medium flex items-center gap-2">
                                        <Tag size={16} color="var(--color-primary)" /> {tag}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRenameTag(tag)} title="Renommer" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer p-1.5 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                                            <PencilSimple size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTag(tag)} title="Supprimer" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 transition-colors">
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
