import React from 'react';
import { X, ClockCounterClockwise } from '@phosphor-icons/react';
import type { Card } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CardHistoryModalProps {
    card: Card;
    onClose: () => void;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, onClose }) => {
    const history = card.history || [];
    const modalRef = useFocusTrap(true);
    
    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div ref={modalRef} className="modal-content" style={{ display: 'flex', flexDirection: 'column', padding: 0, maxWidth: '600px', maxHeight: '80vh' }}>
                <header className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClockCounterClockwise size={22} weight="bold" />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>Historique des modifications</h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{card.title}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} title="Fermer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={24} weight="bold" />
                    </button>
                </header>
                
                <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '40px 0' }}>Aucun historique disponible pour cette fiche.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {[...history].reverse().map((entry, index) => (
                                <div key={index} style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: entry.action === 'create' ? '#10b981' : '#3b82f6', marginTop: 6 }} />
                                        {index !== history.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', margin: '4px 0' }} />}
                                    </div>
                                    <div style={{ flex: 1, paddingBottom: index !== history.length - 1 ? '24px' : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                                                {entry.action === 'create' ? 'Création' : 'Mise à jour'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {new Date(entry.timestamp).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        {entry.userId && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                                                Auteur: {entry.userId}
                                            </div>
                                        )}
                                        {entry.diff && Object.entries(entry.diff).map(([key, changes]) => (
                                            <div key={key} style={{ marginTop: '12px', background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{key}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '6px 10px', borderRadius: '4px', textDecoration: 'line-through' }}>
                                                        {changes.old || '(vide)'}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '6px 10px', borderRadius: '4px' }}>
                                                        {changes.new || '(vide)'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
