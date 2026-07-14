import React, { useState } from 'react';
import { X, FilePlus, UploadSimple } from '@phosphor-icons/react';
import { CardFormContent } from './CardForm';
import { BatchImportContent } from './BatchImportModal';
import type { Card } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AddDataModalProps {
    mode: 'create' | 'edit' | 'import';
    card?: Card | null;
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    onPause?: (draftCard: Partial<Card>) => void;
    layout?: 'modal' | 'drawer';
}

export const AddDataModal: React.FC<AddDataModalProps> = ({ mode = 'create', card, existingCards = [], onSave, onImport, onClose, onPause, layout = 'modal' }) => {
    const isEditMode = mode === 'edit' && !!card;
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>(mode === 'import' ? 'batch' : 'single');

    const modalRef = useFocusTrap(true);

    return (
        <div className={`modal-overlay ${layout === 'drawer' ? 'drawer-overlay' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div 
                ref={modalRef}
                className={`modal-content glass-modal form-modal flex flex-col ${layout === 'drawer' ? 'fixed right-0 top-0 h-full max-h-none rounded-none w-full max-w-2xl animate-in slide-in-from-right-full duration-300 shadow-2xl border-l border-slate-200 dark:border-slate-800' : 'max-w-[1200px] w-[95vw] h-[85vh] max-h-[1000px]'}`} 
            >
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Modifier la fiche' : 'Ajouter des données'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {!isEditMode && (
                    <div className="pt-6 px-8 flex gap-4 border-b border-[color:var(--color-border)]">
                        <div className="flex bg-[color:var(--color-surface)] p-1 rounded-xl border border-[color:var(--color-border)]">
                            <button
                                onClick={() => setActiveTab('single')}
                                className={activeTab === 'single' ? 'extnd-btn extnd-btn-primary' : 'extnd-btn extnd-btn-ghost'}
                            >
                                <FilePlus size={18} />
                                Nouvelle Fiche
                            </button>
                            <button
                                onClick={() => setActiveTab('batch')}
                                className={activeTab === 'batch' ? 'extnd-btn extnd-btn-primary' : 'extnd-btn extnd-btn-ghost'}
                            >
                                <UploadSimple size={18} />
                                Import en Masse
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-body mt-0 flex-1 min-h-0 overflow-hidden flex flex-col p-0">
                    {activeTab === 'single' ? (
                        <CardFormContent
                            card={card}
                            existingCards={existingCards}
                            onSave={async (c) => {
                                await onSave(c);
                                onClose();
                            }}
                            onCancel={onClose}
                            onPause={onPause}
                        />
                    ) : (
                        <BatchImportContent
                            onImport={onImport}
                            onClose={onClose}
                            existingCards={existingCards}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
