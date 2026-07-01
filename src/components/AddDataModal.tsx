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
                className={`modal-content glass-modal form-modal ${layout === 'drawer' ? 'fixed right-0 top-0 h-full max-h-none rounded-none w-full max-w-2xl animate-in slide-in-from-right-full duration-300 shadow-2xl border-l border-slate-200 dark:border-slate-800' : ''}`} 
                style={layout === 'modal' ? { maxWidth: '1200px', width: '95vw', height: '85vh', maxHeight: '1000px', display: 'flex', flexDirection: 'column' } : { display: 'flex', flexDirection: 'column' }}
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
                    <div style={{ padding: '24px 32px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', background: 'var(--color-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setActiveTab('single')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    color: activeTab === 'single' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === 'single' ? 600 : 500,
                                    background: activeTab === 'single' ? 'var(--color-bg)' : 'transparent',
                                    boxShadow: activeTab === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FilePlus size={18} />
                                Nouvelle Fiche
                            </button>
                            <button
                                onClick={() => setActiveTab('batch')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    color: activeTab === 'batch' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === 'batch' ? 600 : 500,
                                    background: activeTab === 'batch' ? 'var(--color-bg)' : 'transparent',
                                    boxShadow: activeTab === 'batch' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <UploadSimple size={18} />
                                Import en Masse
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-body" style={{ marginTop: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
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
