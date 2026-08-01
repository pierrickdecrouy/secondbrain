import React from 'react';
import { X, ClockCounterClockwise } from '@phosphor-icons/react';
import type { Card } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './styles/CardHistoryModal.css';

interface CardHistoryModalProps {
    card: Card;
    onClose: () => void;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, onClose }) => {
    const history = card.history || [];
    const modalRef = useFocusTrap(true);
    
    return (
        <div className="modal-overlay cardhistorymodal-style-1" >
            <div ref={modalRef} className="modal-content cardhistorymodal-style-2" >
                <header className="modal-header cardhistorymodal-style-3" >
                    <div className="cardhistorymodal-style-4" >
                        <div className="cardhistorymodal-style-5" >
                            <ClockCounterClockwise size={22} weight="bold" />
                        </div>
                        <div>
                            <h2 className="modal-title cardhistorymodal-style-6" >Historique des modifications</h2>
                            <p className="cardhistorymodal-style-7" >{card.title}</p>
                        </div>
                    </div>
                    <button className="modal-close cardhistorymodal-style-8" onClick={onClose} title="Fermer" >
                        <X size={24} weight="bold" />
                    </button>
                </header>
                
                <div  className="custom-scrollbar cardhistorymodal-style-9">
                    {history.length === 0 ? (
                        <p className="cardhistorymodal-style-10" >Aucun historique disponible pour cette fiche.</p>
                    ) : (
                        <div className="cardhistorymodal-style-11" >
                            {[...history].reverse().map((entry, index) => (
                                <div key={index} className="cardhistorymodal-style-12" >
                                    <div className="cardhistorymodal-style-13" >
                                        <div className="cardhistorymodal-style-14" style={{
  background: entry.action === 'create' ? '#10b981' : '#3b82f6'
}} />
                                        {index !== history.length - 1 && <div className="cardhistorymodal-style-15"  />}
                                    </div>
                                    <div className="cardhistorymodal-style-16" style={{
  paddingBottom: index !== history.length - 1 ? '24px' : 0
}}>
                                        <div className="cardhistorymodal-style-17" >
                                            <span className="cardhistorymodal-style-18" >
                                                {entry.action === 'create' ? 'Création' : 'Mise à jour'}
                                            </span>
                                            <span className="cardhistorymodal-style-19" >
                                                {new Date(entry.timestamp).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        {entry.userId && (
                                            <div className="cardhistorymodal-style-20" >
                                                Auteur: {entry.userId}
                                            </div>
                                        )}
                                        {entry.diff && Object.entries(entry.diff).map(([key, changes]) => (
                                            <div key={key} className="cardhistorymodal-style-21" >
                                                <div className="cardhistorymodal-style-22" >{key}</div>
                                                <div className="cardhistorymodal-style-23" >
                                                    <div className="cardhistorymodal-style-24" >
                                                        {changes.old || '(vide)'}
                                                    </div>
                                                    <div className="cardhistorymodal-style-25" >
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
