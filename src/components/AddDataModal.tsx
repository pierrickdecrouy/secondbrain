import React, { useState } from 'react';
import { X, FilePlus, Upload } from 'lucide-react';
import { CardFormContent } from './CardForm';
import { BatchImportContent } from './BatchImportModal';
import type { Card } from '../types';

interface AddDataModalProps {
    mode: 'create' | 'edit' | 'import';
    card?: Card | null;
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
    onClose: () => void;
}

export const AddDataModal: React.FC<AddDataModalProps> = ({ mode = 'create', card, existingCards = [], onSave, onImport, onClose }) => {
    const isEditMode = mode === 'edit' && !!card;
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>(mode === 'import' ? 'batch' : 'single');

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content form-modal" style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Modifier la fiche' : 'Ajouter des données'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {!isEditMode && (
                    <div style={{ padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px' }}>
                        <button
                            onClick={() => setActiveTab('single')}
                            style={{
                                padding: '12px 0',
                                borderBottom: activeTab === 'single' ? '2px solid #0369a1' : '2px solid transparent',
                                color: activeTab === 'single' ? '#0369a1' : '#64748b',
                                fontWeight: activeTab === 'single' ? 600 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <FilePlus size={18} />
                            Nouvelle Fiche
                        </button>
                        <button
                            onClick={() => setActiveTab('batch')}
                            style={{
                                padding: '12px 0',
                                borderBottom: activeTab === 'batch' ? '2px solid #0369a1' : '2px solid transparent',
                                color: activeTab === 'batch' ? '#0369a1' : '#64748b',
                                fontWeight: activeTab === 'batch' ? 600 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Upload size={18} />
                            Import en Masse
                        </button>
                    </div>
                )}

                <div className="modal-body" style={{ marginTop: 0 }}>
                    {activeTab === 'single' ? (
                        <CardFormContent
                            card={card}
                            existingCards={existingCards}
                            onSave={async (c) => {
                                await onSave(c);
                                onClose();
                            }}
                            onCancel={onClose}
                        />
                    ) : (
                        <BatchImportContent
                            onImport={onImport}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
